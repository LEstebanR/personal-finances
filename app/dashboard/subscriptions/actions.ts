'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

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

  const name = formData.get('name') as string
  const categoryId = formData.get('categoryId') as string
  const subcategoryId = (formData.get('subcategoryId') as string) || null
  const amount = parseCurrencyInput(formData.get('amount'))
  const frequency = parseFrequency(formData.get('frequency'))
  const dueDay = parseDueDay(formData.get('dueDay'))
  const dueMonth =
    frequency === 'yearly' ? parseDueMonth(formData.get('dueMonth')) : null
  const startDate = new Date(formData.get('startDate') as string)

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }

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

  const name = formData.get('name') as string
  const categoryId = formData.get('categoryId') as string
  const subcategoryId = (formData.get('subcategoryId') as string) || null
  const amount = parseCurrencyInput(formData.get('amount'))
  const frequency = parseFrequency(formData.get('frequency'))
  const dueDay = parseDueDay(formData.get('dueDay'))
  const dueMonth =
    frequency === 'yearly' ? parseDueMonth(formData.get('dueMonth')) : null

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }

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
