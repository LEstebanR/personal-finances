// Pure plan-limit logic with no Prisma import, so it can be pulled into
// client components (e.g. to disable "previous month" navigation for Free
// users) as well as server actions in lib/plan-limits.ts.

export const FREE_LIMITS = {
  accounts: 2,
  debts: 2,
  subscriptions: 2,
  transactionsPerMonth: 100,
  // Budget view: current month + this many months back.
  budgetMonthsBack: 1,
  // Spending trends: this many months of history, including the current one.
  trendsMonths: 3,
} as const

// UTC calendar-month bounds for "this month", used to count transactions
// against the Free plan's monthly limit.
export function currentMonthRange() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  return {
    gte: new Date(Date.UTC(year, month, 1)),
    lt: new Date(Date.UTC(year, month + 1, 1)),
  }
}

// How many calendar months back from now a given (month, year) falls,
// clamped at 0 for the current month. Negative values mean the future.
export function monthsBack(month: number, year: number): number {
  const now = new Date()
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month)
}

export const PLAN_LIMIT_ERROR_PREFIX = 'Free plan is limited'

export function isPlanLimitError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.startsWith(PLAN_LIMIT_ERROR_PREFIX)
  )
}
