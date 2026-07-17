'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function getCategoryMonthlyTotals(year: number) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const range = {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  }

  const [categories, expenses] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session.user.id, type: 'expense' },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, type: 'expense', date: range },
      select: { categoryId: true, amount: true, date: true },
    }),
  ])

  const monthlyTotalsByCategory = new Map<string, number[]>()
  for (const category of categories) {
    monthlyTotalsByCategory.set(category.id, Array(12).fill(0))
  }
  for (const expense of expenses) {
    const monthlyTotals = monthlyTotalsByCategory.get(expense.categoryId)
    if (!monthlyTotals) continue
    monthlyTotals[expense.date.getUTCMonth()] += Number(expense.amount)
  }

  return categories
    .map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      monthlyTotals: monthlyTotalsByCategory.get(category.id)!,
    }))
    .filter((item) => item.monthlyTotals.some((amount) => amount > 0))
}
