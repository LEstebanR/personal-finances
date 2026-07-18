'use server'

import { parseCurrencyInput } from '@/lib/currency'
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
})

const createSubscriptionSchema = subscriptionFieldsSchema.extend({
  startDate: validDate,
})

export async function getSubscriptions() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: { category: true, subcategory: true },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return subscriptions.map(({ category, subcategory, ...sub }) => ({
    ...sub,
    amount: Number(sub.amount),
    categoryName: category.name,
    subcategoryName: subcategory?.name ?? null,
  }))
}

export async function createSubscription(formData: FormData) {
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
    startDate: new Date(formData.get('startDate') as string),
  })

  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

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
      startDate,
    },
  })

  return { ...subscription, amount: Number(subscription.amount) }
}

export async function updateSubscription(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const frequency = parseFrequency(formData.get('frequency'))
  const { name, categoryId, subcategoryId, amount, dueDay, dueMonth } =
    subscriptionFieldsSchema.parse({
      name: formData.get('name'),
      categoryId: formData.get('categoryId'),
      subcategoryId: (formData.get('subcategoryId') as string) || null,
      amount: parseCurrencyInput(formData.get('amount')),
      frequency,
      dueDay: parseDueDay(formData.get('dueDay')),
      dueMonth:
        frequency === 'yearly' ? parseDueMonth(formData.get('dueMonth')) : null,
    })

  await prisma.subscription.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })
  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

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
