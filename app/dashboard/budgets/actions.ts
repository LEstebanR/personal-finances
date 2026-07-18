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

const budgetItemSchema = z.object({
  categoryId: uuidField,
  subcategoryId: uuidField.nullable(),
  amount: positiveAmount,
  description: z.string(),
  date: validDate,
})

const recurringExpenseSchema = z.object({
  categoryId: uuidField,
  subcategoryId: uuidField.nullable(),
  amount: positiveAmount,
  name: requiredString,
  frequency: z.enum(['weekly', 'monthly']),
  date: validDate,
})

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

interface RecurringSchedule {
  frequency: string
  dueDay: number | null
  dueMonth?: number | null
  weekday?: number | null
  startDate: Date
}

// Supports the three recurrence shapes used across Subscriptions (monthly,
// yearly) and Budget recurring expenses (weekly, monthly): weekly recurs on
// a matching weekday every month, yearly recurs once a year on dueMonth, and
// monthly recurs once a month on dueDay (clamped to the month's length).
// Occurrences before the schedule's startDate are skipped so something
// started mid-period doesn't backfill earlier weeks/months/years.
function occurrenceDatesInMonth(
  schedule: RecurringSchedule,
  year: number,
  month: number,
  daysInMonth: number
): Date[] {
  if (schedule.frequency === 'weekly') {
    const dates: Date[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day))
      if (date.getUTCDay() === schedule.weekday && date >= schedule.startDate) {
        dates.push(date)
      }
    }
    return dates
  }

  if (schedule.frequency === 'yearly' && schedule.dueMonth !== month) {
    return []
  }

  const day = Math.min(schedule.dueDay ?? 1, daysInMonth)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date >= schedule.startDate ? [date] : []
}

// Lazily backfills this month's planned expenses for every active
// subscription that had already started by then. Safe to call from multiple
// places concurrently: the unique (subscriptionId, date) constraint plus
// skipDuplicates means a race just results in one insert winning, not
// duplicate rows.
async function ensureSubscriptionBudgetItems(
  userId: string,
  month: number,
  year: number
) {
  const range = monthRange(month, year)

  const subscriptions = await prisma.subscription.findMany({
    where: { userId, isActive: true, startDate: { lt: range.lt } },
  })
  if (subscriptions.length === 0) return

  const existing = await prisma.budgetItem.findMany({
    where: {
      userId,
      subscriptionId: { in: subscriptions.map((s) => s.id) },
      date: range,
    },
    select: { subscriptionId: true, date: true },
  })
  const existingKeys = new Set(
    existing.map((e) => `${e.subscriptionId}:${e.date.getTime()}`)
  )

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const toCreate = subscriptions.flatMap((subscription) =>
    occurrenceDatesInMonth(subscription, year, month, daysInMonth)
      .filter(
        (date) => !existingKeys.has(`${subscription.id}:${date.getTime()}`)
      )
      .map((date) => ({
        userId,
        categoryId: subscription.categoryId,
        subcategoryId: subscription.subcategoryId,
        subscriptionId: subscription.id,
        date,
        amount: subscription.amount,
        description: subscription.name,
      }))
  )
  if (toCreate.length === 0) return

  await prisma.budgetItem.createMany({ data: toCreate, skipDuplicates: true })
}

// Same idea as ensureSubscriptionBudgetItems, but for recurring expenses
// added directly from the Budget view. Kept as a separate model from
// Subscription on purpose: these shouldn't show up in the Subscriptions view
// or be manageable from there, even though the recurrence math is identical.
async function ensureRecurringExpenseBudgetItems(
  userId: string,
  month: number,
  year: number
) {
  const range = monthRange(month, year)

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where: { userId, isActive: true, startDate: { lt: range.lt } },
  })
  if (recurringExpenses.length === 0) return

  const existing = await prisma.budgetItem.findMany({
    where: {
      userId,
      recurringExpenseId: { in: recurringExpenses.map((r) => r.id) },
      date: range,
    },
    select: { recurringExpenseId: true, date: true },
  })
  const existingKeys = new Set(
    existing.map((e) => `${e.recurringExpenseId}:${e.date.getTime()}`)
  )

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const toCreate = recurringExpenses.flatMap((recurringExpense) =>
    occurrenceDatesInMonth(recurringExpense, year, month, daysInMonth)
      .filter(
        (date) => !existingKeys.has(`${recurringExpense.id}:${date.getTime()}`)
      )
      .map((date) => ({
        userId,
        categoryId: recurringExpense.categoryId,
        subcategoryId: recurringExpense.subcategoryId,
        recurringExpenseId: recurringExpense.id,
        date,
        amount: recurringExpense.amount,
        description: recurringExpense.name,
      }))
  )
  if (toCreate.length === 0) return

  await prisma.budgetItem.createMany({ data: toCreate, skipDuplicates: true })
}

// Debts with both a minimum payment and a due day behave like a monthly
// recurring expense: one occurrence a month, on paymentDueDay, categorized
// under the "Deuda" default category (debts don't have their own category).
// Uses the debt's createdAt as the schedule's startDate so a debt added
// mid-month doesn't backfill a payment for a month before it existed.
async function ensureDebtBudgetItems(
  userId: string,
  month: number,
  year: number
) {
  const range = monthRange(month, year)

  const debts = await prisma.debt.findMany({
    where: {
      userId,
      minimumPayment: { not: null },
      paymentDueDay: { not: null },
      remainingBalance: { gt: 0 },
    },
  })
  if (debts.length === 0) return

  const debtCategory = await prisma.category.findFirst({
    where: {
      userId,
      type: 'expense',
      name: { equals: 'Deuda', mode: 'insensitive' },
    },
  })
  if (!debtCategory) return

  const existing = await prisma.budgetItem.findMany({
    where: { userId, debtId: { in: debts.map((d) => d.id) }, date: range },
    select: { debtId: true, date: true },
  })
  const existingKeys = new Set(
    existing.map((e) => `${e.debtId}:${e.date.getTime()}`)
  )

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const toCreate = debts.flatMap((debt) => {
    const { minimumPayment, paymentDueDay } = debt
    if (minimumPayment === null || paymentDueDay === null) return []

    return occurrenceDatesInMonth(
      {
        frequency: 'monthly',
        dueDay: paymentDueDay,
        startDate: debt.createdAt,
      },
      year,
      month,
      daysInMonth
    )
      .filter((date) => !existingKeys.has(`${debt.id}:${date.getTime()}`))
      .map((date) => ({
        userId,
        categoryId: debtCategory.id,
        subcategoryId: null,
        debtId: debt.id,
        date,
        amount: minimumPayment,
        description: debt.name,
      }))
  })
  if (toCreate.length === 0) return

  await prisma.budgetItem.createMany({ data: toCreate, skipDuplicates: true })
}

export async function getBudgetOverview(month: number, year: number) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await Promise.all([
    ensureSubscriptionBudgetItems(session.user.id, month, year),
    ensureRecurringExpenseBudgetItems(session.user.id, month, year),
    ensureDebtBudgetItems(session.user.id, month, year),
  ])

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

  await Promise.all([
    ensureSubscriptionBudgetItems(session.user.id, month, year),
    ensureRecurringExpenseBudgetItems(session.user.id, month, year),
    ensureDebtBudgetItems(session.user.id, month, year),
  ])

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

  const { categoryId, subcategoryId, amount, description, date } =
    budgetItemSchema.parse({
      categoryId: formData.get('categoryId'),
      subcategoryId: (formData.get('subcategoryId') as string) || null,
      amount: parseCurrencyInput(formData.get('amount')),
      description: formData.get('description'),
      date: new Date(formData.get('date') as string),
    })

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

  const { categoryId, subcategoryId, amount, description, date } =
    budgetItemSchema.parse({
      categoryId: formData.get('categoryId'),
      subcategoryId: (formData.get('subcategoryId') as string) || null,
      amount: parseCurrencyInput(formData.get('amount')),
      description: formData.get('description'),
      date: new Date(formData.get('date') as string),
    })

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

// Creates the recurring expense and its first occurrence (dated exactly on
// the day the user picked) in one go, instead of relying on the next
// ensureRecurringExpenseBudgetItems pass to backfill it.
export async function createRecurringExpense(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { categoryId, subcategoryId, amount, name, frequency, date } =
    recurringExpenseSchema.parse({
      categoryId: formData.get('categoryId'),
      subcategoryId: (formData.get('subcategoryId') as string) || null,
      amount: parseCurrencyInput(formData.get('amount')),
      name: formData.get('description'),
      frequency: formData.get('frequency') === 'weekly' ? 'weekly' : 'monthly',
      date: new Date(formData.get('date') as string),
    })

  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

  const dueDay = frequency === 'monthly' ? date.getUTCDate() : null
  const weekday = frequency === 'weekly' ? date.getUTCDay() : null

  const item = await prisma.$transaction(async (tx) => {
    const recurringExpense = await tx.recurringExpense.create({
      data: {
        userId: session.user.id,
        name,
        categoryId,
        subcategoryId,
        amount,
        frequency,
        dueDay,
        weekday,
        startDate: date,
      },
    })

    return tx.budgetItem.create({
      data: {
        userId: session.user.id,
        categoryId,
        subcategoryId,
        recurringExpenseId: recurringExpense.id,
        date,
        amount,
        description: name,
      },
    })
  })

  return { ...item, amount: Number(item.amount) }
}

// Converts a plain (occasional) budget item into a recurring expense: the
// submitted fields become the RecurringExpense's baseline, and this same
// BudgetItem is linked to it as its first occurrence instead of a fresh one
// being created, so ensureRecurringExpenseBudgetItems just picks up from here
// going forward.
export async function convertBudgetItemToRecurring(
  id: string,
  formData: FormData
) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { categoryId, subcategoryId, amount, name, frequency, date } =
    recurringExpenseSchema.parse({
      categoryId: formData.get('categoryId'),
      subcategoryId: (formData.get('subcategoryId') as string) || null,
      amount: parseCurrencyInput(formData.get('amount')),
      name: formData.get('description'),
      frequency: formData.get('frequency') === 'weekly' ? 'weekly' : 'monthly',
      date: new Date(formData.get('date') as string),
    })

  const existing = await prisma.budgetItem.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })
  if (
    existing.subscriptionId ||
    existing.recurringExpenseId ||
    existing.debtId
  ) {
    throw new Error('This item is already recurring')
  }
  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId: session.user.id },
  })

  const dueDay = frequency === 'monthly' ? date.getUTCDate() : null
  const weekday = frequency === 'weekly' ? date.getUTCDay() : null

  const item = await prisma.$transaction(async (tx) => {
    const recurringExpense = await tx.recurringExpense.create({
      data: {
        userId: session.user.id,
        name,
        categoryId,
        subcategoryId,
        amount,
        frequency,
        dueDay,
        weekday,
        startDate: date,
      },
    })

    return tx.budgetItem.update({
      where: { id },
      data: {
        categoryId,
        subcategoryId,
        amount,
        description: name,
        date,
        recurringExpenseId: recurringExpense.id,
      },
    })
  })

  return { ...item, amount: Number(item.amount) }
}

// Stops future occurrences (not-yet-arrived planned items) but keeps past
// and current entries as history, mirroring how cancelling a Subscription
// behaves.
export async function cancelRecurringExpense(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.recurringExpense.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.$transaction(async (tx) => {
    await tx.recurringExpense.update({
      where: { id },
      data: { isActive: false },
    })
    await tx.budgetItem.deleteMany({
      where: { recurringExpenseId: id, date: { gt: new Date() } },
    })
  })
}
