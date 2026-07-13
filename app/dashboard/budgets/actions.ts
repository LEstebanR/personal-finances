'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

function previousMonth(month: number, year: number) {
  return month === 1
    ? { month: 12, year: year - 1 }
    : { month: month - 1, year }
}

export async function getBudgetOverview(month: number, year: number) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const prev = previousMonth(month, year)

  const [categories, budgets, previousBudgets, expenses] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session.user.id, type: 'expense' },
      orderBy: { name: 'asc' },
    }),
    prisma.budget.findMany({
      where: { userId: session.user.id, month, year },
    }),
    prisma.budget.findMany({
      where: { userId: session.user.id, month: prev.month, year: prev.year },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'expense',
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(
            month === 12 ? year + 1 : year,
            month === 12 ? 0 : month,
            1
          ),
        },
      },
      select: { categoryId: true, amount: true },
    }),
  ])

  const spentByCategory = new Map<string, number>()
  for (const expense of expenses) {
    spentByCategory.set(
      expense.categoryId,
      (spentByCategory.get(expense.categoryId) ?? 0) + Number(expense.amount)
    )
  }

  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b]))
  const previousBudgetByCategory = new Map(
    previousBudgets.map((b) => [b.categoryId, Number(b.amount)])
  )

  return categories.map((category) => {
    const budget = budgetByCategory.get(category.id)
    return {
      categoryId: category.id,
      categoryName: category.name,
      budgetId: budget?.id ?? null,
      amount: budget ? Number(budget.amount) : null,
      suggestedAmount: previousBudgetByCategory.get(category.id) ?? null,
      spent: spentByCategory.get(category.id) ?? 0,
    }
  })
}

export async function setBudget(
  categoryId: string,
  month: number,
  year: number,
  amountInput: FormDataEntryValue | string
) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const amount = parseCurrencyInput(amountInput as FormDataEntryValue)
  if (Number.isNaN(amount) || amount < 0) {
    throw new Error('Invalid budget amount')
  }

  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId: session.user.id,
        categoryId,
        month,
        year,
      },
    },
    create: { userId: session.user.id, categoryId, month, year, amount },
    update: { amount },
  })

  return { ...budget, amount: Number(budget.amount) }
}

export async function deleteBudget(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.budget.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.budget.delete({ where: { id } })
}
