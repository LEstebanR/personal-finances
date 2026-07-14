'use client'

import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useBudgetOverview, useOverviewData } from '@/lib/queries'
import {
  DollarSign,
  Landmark,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart'
import { Skeleton } from '../ui/skeleton'

const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface Transaction {
  id: string
  accountId: string | null
  debtId: string | null
  amount: number
  type: string
  description: string
  date: Date
  categoryName: string
  sourceName: string | null
  createdAt: Date
}

interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  date: Date
  note: string | null
  createdAt: Date
}

type CombinedItem =
  | (Transaction & { itemType: 'transaction' })
  | (Transfer & {
      itemType: 'transfer'
      fromAccountName?: string
      toAccountName?: string
    })

const EMPTY_ARRAY: never[] = []

export function Overview() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const now = new Date()
  const { data: overviewData, isLoading: loadingOverview } = useOverviewData()
  const { data: budgetItems = EMPTY_ARRAY, isLoading: loadingBudget } =
    useBudgetOverview(now.getMonth() + 1, now.getFullYear())
  const accounts = overviewData?.accounts ?? EMPTY_ARRAY
  const transactions = overviewData?.transactions ?? EMPTY_ARRAY
  const transfers = overviewData?.transfers ?? EMPTY_ARRAY
  const totalDebt = overviewData?.totalDebt ?? 0
  const loading = loadingOverview || loadingBudget
  const recentItems = useMemo(() => {
    const accountMap = new Map<string, string>()
    for (const account of accounts) {
      accountMap.set(account.id, account.name)
    }

    const transactionItems: CombinedItem[] = transactions
      .slice(0, 5)
      .map((t) => ({
        ...t,
        itemType: 'transaction' as const,
      }))

    const transferItems: CombinedItem[] = transfers.slice(0, 5).map((t) => ({
      ...t,
      itemType: 'transfer' as const,
      fromAccountName: accountMap.get(t.fromAccountId),
      toAccountName: accountMap.get(t.toAccountId),
    }))

    return [...transactionItems, ...transferItems]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
  }, [accounts, transactions, transfers])

  const getTotalBalance = () => {
    return accounts.reduce(
      (total, account) => total + (account.currentBalance || 0),
      0
    )
  }

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })

    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return { income, expenses }
  }

  const monthlyStats = getMonthlyStats()

  const getCategoryBreakdown = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyExpenses = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)
      return (
        transaction.type === 'expense' &&
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      )
    })

    const totals = new Map<string, number>()
    for (const transaction of monthlyExpenses) {
      const key = transaction.categoryName || t('overview.uncategorized')
      totals.set(key, (totals.get(key) ?? 0) + Number(transaction.amount))
    }

    return Array.from(totals.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  const categoryBreakdown = getCategoryBreakdown()
  const categoryChartConfig = categoryBreakdown.reduce<ChartConfig>(
    (config, item, index) => {
      config[item.category] = {
        label: item.category,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }
      return config
    },
    { amount: { label: t('overview.amount') } }
  )

  const budgetedItems = budgetItems.filter(
    (item) => item.amount !== null || item.suggestedAmount !== null
  )
  const totalBudgeted = budgetedItems.reduce(
    (sum, item) => sum + (item.amount ?? item.suggestedAmount ?? 0),
    0
  )
  const totalBudgetSpent = budgetedItems.reduce(
    (sum, item) => sum + item.spent,
    0
  )
  const budgetPercent =
    totalBudgeted > 0
      ? Math.min(100, (totalBudgetSpent / totalBudgeted) * 100)
      : 0
  const overBudgetCategories = budgetedItems.filter(
    (item) => item.spent > (item.amount ?? item.suggestedAmount ?? 0)
  )

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
        <div className="w-full space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">{t('overview.title')}</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('overview.totalBalance')}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatMoney(getTotalBalance(), currency)}
              </div>
              <p className="text-muted-foreground text-xs">
                {t('overview.across')} {accounts.length}{' '}
                {accounts.length === 1
                  ? t('overview.account')
                  : t('overview.accountsPlural')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('overview.monthlyIncome')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${formatMoney(monthlyStats.income, currency)}
              </div>
              <p className="text-muted-foreground text-xs">
                {t('overview.thisMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('overview.monthlyExpenses')}
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -${formatMoney(monthlyStats.expenses, currency)}
              </div>
              <p className="text-muted-foreground text-xs">
                {t('overview.thisMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('overview.netIncome')}
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  monthlyStats.income - monthlyStats.expenses >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {monthlyStats.income - monthlyStats.expenses >= 0 ? '+' : ''}$
                {formatMoney(
                  monthlyStats.income - monthlyStats.expenses,
                  currency
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {t('overview.thisMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('overview.totalDebt')}
              </CardTitle>
              <Landmark className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatMoney(totalDebt, currency)}
              </div>
              <p className="text-muted-foreground text-xs">
                {t('overview.outstanding')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.budgetProgress')}</CardTitle>
            <CardDescription>
              {t('overview.budgetProgressDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-2 text-4xl">🎯</span>
                <p className="text-muted-foreground">
                  {t('overview.noBudgetYet')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      ${formatMoney(totalBudgetSpent, currency)} / $
                      {formatMoney(totalBudgeted, currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(budgetPercent)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        totalBudgetSpent > totalBudgeted
                          ? 'bg-red-500'
                          : budgetPercent >= 80
                            ? 'bg-yellow-500'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${budgetPercent}%` }}
                    />
                  </div>
                </div>
                {overBudgetCategories.length > 0 && (
                  <p className="text-xs text-red-600">
                    {t('overview.overBudgetIn', {
                      categories: overBudgetCategories
                        .map((c) => c.categoryName)
                        .join(', '),
                    })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.categoryBreakdown')}</CardTitle>
            <CardDescription>
              {t('overview.categoryBreakdownDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-2 text-4xl">🥧</span>
                <p className="text-muted-foreground">
                  {t('overview.noExpensesThisMonth')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <ChartContainer
                  config={categoryChartConfig}
                  className="mx-auto aspect-square max-h-64 w-full sm:w-1/2"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            `$${formatMoney(Number(value), currency)}`
                          }
                        />
                      }
                    />
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={55}
                      strokeWidth={2}
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.category} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="w-full space-y-2 sm:w-1/2">
                  {categoryBreakdown.map((entry) => (
                    <div
                      key={entry.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: entry.fill }}
                        />
                        <span className="truncate">{entry.category}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0 pl-2">
                        ${formatMoney(entry.amount, currency)} (
                        {Math.round(
                          (entry.amount / monthlyStats.expenses) * 100
                        )}
                        %)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.recentActivity')}</CardTitle>
            <CardDescription>
              {t('overview.recentActivityDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-2 text-4xl">📭</span>
                <p className="text-muted-foreground">
                  {t('overview.noActivity')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          item.itemType === 'transaction'
                            ? item.type === 'income'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {item.itemType === 'transaction' ? (
                          item.type === 'income' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )
                        ) : (
                          <Wallet className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {item.itemType === 'transaction'
                            ? item.description || item.categoryName
                            : item.note || t('overview.transfer')}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {item.itemType === 'transaction' ? (
                            <>
                              {item.sourceName}
                              {item.categoryName && ` • ${item.categoryName}`}
                            </>
                          ) : (
                            <>
                              {item.fromAccountName} → {item.toAccountName}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          item.itemType === 'transaction'
                            ? item.type === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {item.itemType === 'transaction' &&
                        item.type === 'income'
                          ? '+'
                          : item.itemType === 'transaction'
                            ? '-'
                            : ''}
                        ${formatMoney(Number(item.amount), currency)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          timeZone: 'UTC',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.accountSummary')}</CardTitle>
            <CardDescription>
              {t('overview.accountSummaryDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="mb-2 text-4xl">🏦</span>
                <p className="text-muted-foreground">
                  {t('overview.noAccounts')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => {
                  const Icon = account.type === 'cash' ? Wallet : PiggyBank
                  return (
                    <div
                      key={account.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center space-x-3">
                        <div className="bg-primary/10 rounded-lg p-2">
                          <Icon className="text-primary h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="truncate font-semibold">
                            {account.name}
                          </h3>
                          <span className="text-primary bg-primary/10 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize">
                            {account.type}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-sm">
                          {t('overview.balance')}
                        </p>
                        <p className="text-xl font-bold">
                          $
                          {formatMoney(
                            Number(account.currentBalance),
                            currency
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
