'use server'

import { createTransaction } from '@/app/dashboard/transactions/actions'
import { parseCurrencyInput } from '@/lib/currency'
import {
  FREE_LIMITS,
  getUserPlan,
  reconcileSubscriptionLocks,
} from '@/lib/plan-limits'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import {
  positiveAmount,
  requiredString,
  uuidField,
  validDate,
} from '@/lib/validation'
import { z } from 'zod'

function parseDueDay(value: FormDataEntryValue | null): number {
  const parsed = parseInt(String(value ?? ''), 10)
  if (Number.isNaN(parsed)) throw new Error('Invalid due day')
  return Math.min(31, Math.max(1, parsed))
}

function parseDueMonth(value: FormDataEntryValue | null): number {
  const parsed = parseInt(String(value ?? ''), 10)
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
    throw new Error('Invalid due month')
  }
  return parsed
}

function parseFrequency(
  value: FormDataEntryValue | null
): 'yearly' | 'monthly' {
  return value === 'yearly' ? 'yearly' : 'monthly'
}

const subscriptionFieldsSchema = z.object({
  name: requiredString,
  categoryId: uuidField,
  subcategoryId: uuidField.nullable(),
  amount: positiveAmount,
  frequency: z.enum(['monthly', 'yearly']),
  dueDay: z.number().int().min(1).max(31),
  dueMonth: z.number().int().min(1).max(12).nullable(),
  accountId: uuidField.nullable(),
  debtId: uuidField.nullable(),
})

const paymentSourceRefinement = (data: {
  accountId: string | null
  debtId: string | null
}) => !!data.accountId || !!data.debtId

const updateSubscriptionSchema = subscriptionFieldsSchema.refine(
  paymentSourceRefinement,
  { message: 'An account or credit card is required', path: ['accountId'] }
)

const createSubscriptionSchema = subscriptionFieldsSchema
  .extend({ startDate: validDate })
  .refine(paymentSourceRefinement, {
    message: 'An account or credit card is required',
    path: ['accountId'],
  })

export async function getSubscriptions() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const plan = await getUserPlan(session.user.id)
  await reconcileSubscriptionLocks(session.user.id, plan)

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: { category: true, subcategory: true, account: true, debt: true },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return subscriptions.map(
    ({ category, subcategory, account, debt, ...sub }) => ({
      ...sub,
      amount: Number(sub.amount),
      categoryName: category.name,
      subcategoryName: subcategory?.name ?? null,
      sourceName: account?.name ?? debt?.name ?? null,
      isDebtSource: !!debt,
    })
  )
}

export async function createSubscription(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const plan = await getUserPlan(session.user.id)
  if (plan !== 'PRO') {
    const activeCount = await prisma.subscription.count({
      where: { userId: session.user.id, isActive: true },
    })
    if (activeCount >= FREE_LIMITS.subscriptions) {
      throw new Error(
        `Free plan is limited to ${FREE_LIMITS.subscriptions} subscriptions. Upgrade to Pro for unlimited subscriptions.`
      )
    }
  }

  const frequency = parseFrequency(formData.get('frequency'))
  const {
    name,
    categoryId,
    subcategoryId,
    amount,
    dueDay,
    dueMonth,
    accountId,
    debtId,
    startDate,
  } = createSubscriptionSchema.parse({
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    subcategoryId: (formData.get('subcategoryId') as string) || null,
    amount: parseCurrencyInput(formData.get('amount')),
    frequency,
    dueDay: parseDueDay(formData.get('dueDay')),
    dueMonth:
      frequency === 'yearly' ? parseDueMonth(formData.get('dueMonth')) : null,
    accountId: (formData.get('accountId') as string) || null,
    debtId: (formData.get('debtId') as string) || null,
    startDate: new Date(formData.get('startDate') as string),
  })

  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })
  if (accountId) {
    await prisma.account.findFirstOrThrow({
      where: { id: accountId, userId: session.user.id },
    })
  } else if (debtId) {
    await prisma.debt.findFirstOrThrow({
      where: { id: debtId, userId: session.user.id, type: 'credit_card' },
    })
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      name,
      categoryId,
      subcategoryId,
      amount,
      frequency,
      dueDay,
      dueMonth,
      accountId,
      debtId,
      startDate,
    },
  })

  return { ...subscription, amount: Number(subscription.amount) }
}

export async function updateSubscription(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const frequency = parseFrequency(formData.get('frequency'))
  const {
    name,
    categoryId,
    subcategoryId,
    amount,
    dueDay,
    dueMonth,
    accountId,
    debtId,
  } = updateSubscriptionSchema.parse({
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    subcategoryId: (formData.get('subcategoryId') as string) || null,
    amount: parseCurrencyInput(formData.get('amount')),
    frequency,
    dueDay: parseDueDay(formData.get('dueDay')),
    dueMonth:
      frequency === 'yearly' ? parseDueMonth(formData.get('dueMonth')) : null,
    accountId: (formData.get('accountId') as string) || null,
    debtId: (formData.get('debtId') as string) || null,
  })

  await prisma.subscription.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })
  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })
  if (accountId) {
    await prisma.account.findFirstOrThrow({
      where: { id: accountId, userId: session.user.id },
    })
  } else if (debtId) {
    await prisma.debt.findFirstOrThrow({
      where: { id: debtId, userId: session.user.id, type: 'credit_card' },
    })
  }

  const subscription = await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        name,
        categoryId,
        subcategoryId,
        amount,
        frequency,
        dueDay,
        dueMonth,
        accountId,
        debtId,
      },
    })

    // Not-yet-arrived planned items were generated from the old details;
    // drop them so they regenerate with the updated category/amount next
    // time that month is viewed. Items already at or before today stay as
    // the historical record of what was actually planned.
    await tx.budgetItem.deleteMany({
      where: { subscriptionId: id, date: { gt: new Date() } },
    })

    return updated
  })

  return { ...subscription, amount: Number(subscription.amount) }
}

const paySubscriptionSchema = z
  .object({
    accountId: uuidField.nullable(),
    debtId: uuidField.nullable(),
    amount: positiveAmount,
    date: validDate,
  })
  .refine((data) => !!data.accountId || !!data.debtId, {
    message: 'An account or credit card is required',
    path: ['accountId'],
  })

// Paying a subscription is just a regular expense transaction, categorized
// like the subscription and charged to the chosen account/credit card —
// createTransaction already handles the account/debt balance mutation.
export async function paySubscription(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const subscription = await prisma.subscription.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  const { accountId, debtId, amount, date } = paySubscriptionSchema.parse({
    accountId: (formData.get('accountId') as string) || null,
    debtId: (formData.get('debtId') as string) || null,
    amount: parseCurrencyInput(formData.get('amount')),
    date: new Date(formData.get('date') as string),
  })

  const transactionFormData = new FormData()
  transactionFormData.set('accountId', accountId ?? '')
  transactionFormData.set('debtId', debtId ?? '')
  // parseCurrencyInput expects comma-decimal input (as CurrencyField produces);
  // String(amount) is always period-decimal with no thousands separators, so a
  // straight swap round-trips it exactly.
  transactionFormData.set('amount', String(amount).replace('.', ','))
  transactionFormData.set('type', 'expense')
  transactionFormData.set('categoryId', subscription.categoryId)
  transactionFormData.set('subcategoryId', subscription.subcategoryId ?? '')
  transactionFormData.set('description', subscription.name)
  transactionFormData.set('date', date.toISOString())

  return createTransaction(transactionFormData)
}

export async function cancelSubscription(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.subscription.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id },
      data: { isActive: false },
    })
    await tx.budgetItem.deleteMany({
      where: { subscriptionId: id, date: { gt: new Date() } },
    })
  })
}

export async function reactivateSubscription(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.subscription.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.subscription.update({
    where: { id },
    data: { isActive: true },
  })
}

export async function deleteSubscription(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.subscription.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.subscription.delete({ where: { id } })
}
