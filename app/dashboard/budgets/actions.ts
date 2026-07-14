'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

// Budget item dates are stored as UTC midnight (date-only values). Building
// these bounds with the local Date constructor uses the server process's
// timezone, which can shift the boundary by several hours and misfile
// items dated on the 1st of the month into the previous month. Date.UTC
// keeps the range anchored the same way the stored dates are.
function monthRange(month: number, year: number) {
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(
      Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1)
    ),
  }
}

export async function getBudgetOverview(month: number, year: number) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const range = monthRange(month, year)

  const [categories, budgetItems, expenses] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session.user.id, type: 'expense' },
      orderBy: { name: 'asc' },
    }),
    prisma.budgetItem.findMany({
      where: { userId: session.user.id, date: range },
      select: { categoryId: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, type: 'expense', date: range },
      select: { categoryId: true, amount: true },
    }),
  ])

  const budgetedByCategory = new Map<string, number>()
  for (const item of budgetItems) {
    budgetedByCategory.set(
      item.categoryId,
      (budgetedByCategory.get(item.categoryId) ?? 0) + Number(item.amount)
    )
  }

  const spentByCategory = new Map<string, number>()
  for (const expense of expenses) {
    spentByCategory.set(
      expense.categoryId,
      (spentByCategory.get(expense.categoryId) ?? 0) + Number(expense.amount)
    )
  }

  return categories
    .map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      amount: budgetedByCategory.get(category.id) ?? null,
      suggestedAmount: null as number | null,
      spent: spentByCategory.get(category.id) ?? 0,
    }))
    .filter((item) => item.amount !== null || item.spent > 0)
}

export async function getBudgetItems(month: number, year: number) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const items = await prisma.budgetItem.findMany({
    where: { userId: session.user.id, date: monthRange(month, year) },
    include: { category: true, subcategory: true },
    orderBy: { date: 'asc' },
  })

  return items.map(({ category, subcategory, ...item }) => ({
    ...item,
    amount: Number(item.amount),
    categoryName: category.name,
    subcategoryName: subcategory?.name ?? null,
  }))
}

export async function createBudgetItem(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const categoryId = formData.get('categoryId') as string
  const subcategoryId = (formData.get('subcategoryId') as string) || null
  const amount = parseCurrencyInput(formData.get('amount'))
  const description = formData.get('description') as string
  const date = new Date(formData.get('date') as string)

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }

  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

  const item = await prisma.budgetItem.create({
    data: {
      userId: session.user.id,
      categoryId,
      subcategoryId,
      date,
      amount,
      description,
    },
  })

  return { ...item, amount: Number(item.amount) }
}

export async function updateBudgetItem(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const categoryId = formData.get('categoryId') as string
  const subcategoryId = (formData.get('subcategoryId') as string) || null
  const amount = parseCurrencyInput(formData.get('amount'))
  const description = formData.get('description') as string
  const date = new Date(formData.get('date') as string)

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }

  await prisma.budgetItem.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })
  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

  const item = await prisma.budgetItem.update({
    where: { id },
    data: { categoryId, subcategoryId, date, amount, description },
  })

  return { ...item, amount: Number(item.amount) }
}

export async function deleteBudgetItem(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.budgetItem.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.budgetItem.delete({ where: { id } })
}
