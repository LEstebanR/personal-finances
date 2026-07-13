'use client'

import { getOverviewData } from '@/app/dashboard/overview/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import {
  DollarSign,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
  currentBalance: number
}

interface Transaction {
  id: string
  accountId: string
  amount: number
  type: string
  description: string
  date: Date
  category: string | null
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
  | (Transaction & { itemType: 'transaction'; accountName?: string })
  | (Transfer & {
      itemType: 'transfer'
      fromAccountName?: string
      toAccountName?: string
    })

export function Overview() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { refreshKey } = useDashboardRefresh()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [recentItems, setRecentItems] = useState<CombinedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getOverviewData()
        setAccounts(data.accounts)
        setTransactions(data.transactions)
        setTransfers(data.transfers)
      } catch (error) {
        console.error('Error loading overview data:', error)
      }
      setLoading(false)
    }

    loadData()
  }, [refreshKey])

  useEffect(() => {
    const accountMap = new Map<string, string>()
    for (const account of accounts) {
      accountMap.set(account.id, account.name)
    }

    const transactionItems: CombinedItem[] = transactions
      .slice(0, 5)
      .map((t) => ({
        ...t,
        itemType: 'transaction' as const,
        accountName: accountMap.get(t.accountId),
      }))

    const transferItems: CombinedItem[] = transfers.slice(0, 5).map((t) => ({
      ...t,
      itemType: 'transfer' as const,
      fromAccountName: accountMap.get(t.fromAccountId),
      toAccountName: accountMap.get(t.toAccountId),
    }))

    const combined = [...transactionItems, ...transferItems]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)

    setRecentItems(combined)
  }, [transactions, transfers, accounts])

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('overview.recentActivity')}</CardTitle>
            <CardDescription>
              {t('overview.recentActivityDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {t('overview.noActivity')}
              </p>
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
                            ? item.description
                            : item.note || t('overview.transfer')}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {item.itemType === 'transaction' ? (
                            <>
                              {item.accountName}
                              {item.category && ` • ${item.category}`}
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
                        {new Date(item.date).toLocaleDateString()}
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
              <p className="text-muted-foreground py-8 text-center">
                {t('overview.noAccounts')}
              </p>
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
