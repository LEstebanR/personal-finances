'use server'

import { parseCurrencyInput, parseOptionalCurrencyInput } from '@/lib/currency'
import { FREE_LIMITS, getUserPlan, reconcileDebtLocks } from '@/lib/plan-limits'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import {
  optionalString,
  positiveAmount,
  requiredString,
  uuidField,
  validDate,
} from '@/lib/validation'
import { type Prisma } from '@prisma/client'
import { z } from 'zod'

const debtTypeSchema = z.enum(['loan', 'credit_card'])

const createDebtSchema = z.object({
  name: requiredString,
  type: debtTypeSchema,
  originalAmount: positiveAmount,
  minimumPayment: positiveAmount.nullable(),
  paymentDueDay: z.number().int().min(1).max(31).nullable(),
  creditLimit: positiveAmount.nullable(),
})

const updateDebtSchema = z.object({
  name: requiredString,
  minimumPayment: positiveAmount.nullable(),
  paymentDueDay: z.number().int().min(1).max(31).nullable(),
  creditLimit: positiveAmount.nullable(),
})

const debtPaymentSchema = z.object({
  debtId: uuidField,
  accountId: uuidField,
  amount: positiveAmount,
  date: validDate,
  note: optionalString,
})

const debtInterestChargeSchema = z.object({
  debtId: uuidField,
  amount: positiveAmount,
  date: validDate,
  note: optionalString,
})

export async function getDebtsForUser(userId: string) {
  const plan = await getUserPlan(userId)
  await reconcileDebtLocks(userId, plan)

  const [debts, paidByDebt] = await Promise.all([
    prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.debtPayment.groupBy({
      by: ['debtId'],
      where: { userId },
      _sum: { amount: true },
    }),
  ])
  const totalPaidByDebtId = new Map(
    paidByDebt.map((row) => [row.debtId, Number(row._sum.amount ?? 0)])
  )

  return debts.map((debt) => ({
    ...debt,
    originalAmount: Number(debt.originalAmount),
    remainingBalance: Number(debt.remainingBalance),
    minimumPayment:
      debt.minimumPayment === null ? null : Number(debt.minimumPayment),
    creditLimit: debt.creditLimit === null ? null : Number(debt.creditLimit),
    // Real cumulative principal payments, distinct from remainingBalance
    // (which also moves with interest charges and credit-card purchases) —
    // used for the "amount paid" progress display so interest can't make it
    // look like it was paid off.
    totalPaid: totalPaidByDebtId.get(debt.id) ?? 0,
  }))
}

export async function getDebts() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  return getDebtsForUser(session.user.id)
}

export async function getDebtPayments(debtId: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const payments = await prisma.debtPayment.findMany({
    where: { debtId, userId: session.user.id },
    orderBy: { date: 'desc' },
  })

  return payments.map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
  }))
}

export async function getDebtInterestCharges(debtId: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const charges = await prisma.debtInterestCharge.findMany({
    where: { debtId, userId: session.user.id },
    orderBy: { date: 'desc' },
  })

  return charges.map((charge) => ({
    ...charge,
    amount: Number(charge.amount),
  }))
}

function parsePaymentDueDay(value: FormDataEntryValue | null): number | null {
  if (!String(value ?? '').trim()) return null
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? null : Math.min(31, Math.max(1, parsed))
}

export async function createDebt(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const plan = await getUserPlan(session.user.id)
  if (plan !== 'PRO') {
    const debtCount = await prisma.debt.count({
      where: { userId: session.user.id },
    })
    if (debtCount >= FREE_LIMITS.debts) {
      throw new Error(
        `Free plan is limited to ${FREE_LIMITS.debts} debts. Upgrade to Pro for unlimited debts.`
      )
    }
  }

  const rawType = (formData.get('type') as string) || 'loan'
  const {
    name,
    type,
    originalAmount,
    minimumPayment,
    paymentDueDay,
    creditLimit,
  } = createDebtSchema.parse({
    name: formData.get('name'),
    type: rawType,
    originalAmount: parseCurrencyInput(formData.get('originalAmount')),
    minimumPayment: parseOptionalCurrencyInput(formData.get('minimumPayment')),
    paymentDueDay: parsePaymentDueDay(formData.get('paymentDueDay')),
    creditLimit:
      rawType === 'credit_card'
        ? parseOptionalCurrencyInput(formData.get('creditLimit'))
        : null,
  })

  const debt = await prisma.debt.create({
    data: {
      userId: session.user.id,
      name,
      type,
      originalAmount,
      remainingBalance: originalAmount,
      minimumPayment,
      paymentDueDay,
      creditLimit,
    },
  })

  return {
    ...debt,
    originalAmount: Number(debt.originalAmount),
    remainingBalance: Number(debt.remainingBalance),
    minimumPayment:
      debt.minimumPayment === null ? null : Number(debt.minimumPayment),
    creditLimit: debt.creditLimit === null ? null : Number(debt.creditLimit),
  }
}

export async function updateDebt(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const existing = await prisma.debt.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  const { name, minimumPayment, paymentDueDay, creditLimit } =
    updateDebtSchema.parse({
      name: formData.get('name'),
      minimumPayment: parseOptionalCurrencyInput(
        formData.get('minimumPayment')
      ),
      paymentDueDay: parsePaymentDueDay(formData.get('paymentDueDay')),
      creditLimit:
        existing.type === 'credit_card'
          ? parseOptionalCurrencyInput(formData.get('creditLimit'))
          : null,
    })

  const debt = await prisma.$transaction(async (tx) => {
    const updated = await tx.debt.update({
      where: { id, userId: session.user.id },
      data: {
        name,
        minimumPayment,
        paymentDueDay,
        creditLimit,
      },
    })

    // Not-yet-arrived planned items were generated from the old minimum
    // payment/due day; drop them so they regenerate with the updated
    // details next time that month is viewed. Past/current entries stay as
    // the historical record of what was actually planned.
    await tx.budgetItem.deleteMany({
      where: { debtId: id, date: { gt: new Date() } },
    })

    return updated
  })

  return {
    ...debt,
    originalAmount: Number(debt.originalAmount),
    remainingBalance: Number(debt.remainingBalance),
    minimumPayment:
      debt.minimumPayment === null ? null : Number(debt.minimumPayment),
    creditLimit: debt.creditLimit === null ? null : Number(debt.creditLimit),
  }
}

export async function deleteDebt(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.$transaction(async (tx) => {
    await tx.debt.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })
    await tx.debt.delete({ where: { id } })
  })
}

// Debt payments are categorized under the same "Deuda" default category the
// budget's minimum-payment planning uses, so the mirrored Transaction lines
// up with what's already budgeted for the debt.
async function getOrCreateDebtCategory(
  tx: Prisma.TransactionClient,
  userId: string
) {
  const existing = await tx.category.findFirst({
    where: {
      userId,
      type: 'expense',
      name: { equals: 'Deuda', mode: 'insensitive' },
    },
  })
  if (existing) return existing

  return tx.category.create({
    data: { userId, name: 'Deuda', type: 'expense', isDefault: true },
  })
}

export async function createDebtPayment(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { debtId, accountId, amount, date, note } = debtPaymentSchema.parse({
    debtId: formData.get('debtId'),
    accountId: formData.get('accountId'),
    amount: parseCurrencyInput(formData.get('amount')),
    date: new Date(formData.get('date') as string),
    note: formData.get('note'),
  })

  const payment = await prisma.$transaction(async (tx) => {
    const [debt, account] = await Promise.all([
      tx.debt.findFirstOrThrow({
        where: { id: debtId, userId: session.user.id },
      }),
      tx.account.findFirstOrThrow({
        where: { id: accountId, userId: session.user.id },
      }),
    ])
    if (debt.userId !== session.user.id || account.userId !== session.user.id) {
      throw new Error('Not authorized')
    }

    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { decrement: amount } },
    })
    const updatedDebt = await tx.debt.update({
      where: { id: debtId },
      data: { remainingBalance: { decrement: amount } },
    })

    // Fully paid off: drop this debt's not-yet-arrived planned budget items
    // (the recurring minimum-payment line) so it stops showing up as a
    // recurring expense. Past/current entries stay as the historical record
    // of what was actually planned, same as when editing a debt's terms.
    if (Number(updatedDebt.remainingBalance) <= 0) {
      await tx.budgetItem.deleteMany({
        where: { debtId, date: { gt: new Date() } },
      })
    }

    const category = await getOrCreateDebtCategory(tx, session.user.id)
    const transaction = await tx.transaction.create({
      data: {
        userId: session.user.id,
        accountId,
        amount,
        type: 'expense',
        description: note?.trim() || `Pago: ${debt.name}`,
        date,
        categoryId: category.id,
      },
    })

    return tx.debtPayment.create({
      data: {
        debtId,
        accountId,
        userId: session.user.id,
        amount,
        date,
        note,
        transactionId: transaction.id,
      },
    })
  })

  return { ...payment, amount: Number(payment.amount) }
}

export async function deleteDebtPayment(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.$transaction(async (tx) => {
    const existing = await tx.debtPayment.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })

    await tx.account.update({
      where: { id: existing.accountId },
      data: { currentBalance: { increment: Number(existing.amount) } },
    })
    await tx.debt.update({
      where: { id: existing.debtId },
      data: { remainingBalance: { increment: Number(existing.amount) } },
    })

    await tx.debtPayment.delete({ where: { id } })
    if (existing.transactionId) {
      await tx.transaction.delete({ where: { id: existing.transactionId } })
    }
  })
}

export async function createDebtInterestCharge(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { debtId, amount, date, note } = debtInterestChargeSchema.parse({
    debtId: formData.get('debtId'),
    amount: parseCurrencyInput(formData.get('amount')),
    date: new Date(formData.get('date') as string),
    note: formData.get('note'),
  })

  const charge = await prisma.$transaction(async (tx) => {
    await tx.debt.findFirstOrThrow({
      where: { id: debtId, userId: session.user.id },
    })

    await tx.debt.update({
      where: { id: debtId },
      data: { remainingBalance: { increment: amount } },
    })

    return tx.debtInterestCharge.create({
      data: {
        debtId,
        userId: session.user.id,
        amount,
        date,
        note,
      },
    })
  })

  return { ...charge, amount: Number(charge.amount) }
}
