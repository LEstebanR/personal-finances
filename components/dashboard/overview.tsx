'use client'

import { supabaseClient } from '@/utils/supabase'
import { User } from '@supabase/supabase-js'
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

interface Account {
  id: string
  userId: string
  name: string
  type: string
  initialBalance: number
  currentBalance: number
  description: string | null
  createdAt: string
  isArchived: boolean
}

interface Transaction {
  id: string
  accountId: string
  userId: string
  amount: number
  type: string
  description: string
  date: string
  category: string | null
  createdAt: string
}

interface Transfer {
  id: string
  userId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  note: string | null
  createdAt: string
}

type CombinedItem =
  | (Transaction & { itemType: 'transaction'; accountName?: string })
  | (Transfer & {
      itemType: 'transfer'
      fromAccountName?: string
      toAccountName?: string
    })

export function Overview() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  )
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [recentItems, setRecentItems] = useState<CombinedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  console.log('accounts', accounts)

  // Función para cargar cuentas
  const loadAccounts = async (currentUser: User) => {
    const supabase = supabaseClient()
    const { data: accounts, error } = await supabase
      .from('Account')
      .select('*')
      .eq('userId', currentUser.id)
      .eq('isArchived', false)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading accounts:', error, user)
    } else {
      setAccounts(accounts || [])
    }
  }

  // Función para cargar últimas 5 transacciones
  const loadRecentTransactions = async (currentUser: User) => {
    const supabase = supabaseClient()
    const { data: transactions, error } = await supabase
      .from('Transaction')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error loading recent transactions:', error)
    } else {
      setRecentTransactions(transactions || [])
      setAllTransactions(transactions || [])
    }
  }

  // Función para cargar transferencias
  const loadTransfers = async (currentUser: User) => {
    const supabase = supabaseClient()
    const { data: transfers, error } = await supabase
      .from('Transfer')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading transfers:', error)
    } else {
      setTransfers(transfers || [])
    }
  }

  // Función para combinar transacciones y transferencias recientes
  const combineRecentItems = () => {
    const accountMap = new Map<string, string>()
    for (const account of accounts) {
      accountMap.set(account.id, account.name)
    }

    const transactionItems: CombinedItem[] = recentTransactions.map((t) => ({
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
  }

  // Función para cargar todas las transacciones (para estadísticas)
  const loadAllTransactions = async (currentUser: User) => {
    const supabase = supabaseClient()
    const { data: transactions, error } = await supabase
      .from('Transaction')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading all transactions:', error)
    } else {
      setAllTransactions(transactions || [])
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      const supabase = supabaseClient()

      // Obtener usuario
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await Promise.all([
          loadAccounts(user),
          loadRecentTransactions(user),
          loadAllTransactions(user),
          loadTransfers(user),
        ])
      }

      setLoading(false)
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Combinar items cuando cambien transacciones, transferencias o cuentas
  useEffect(() => {
    if (accounts.length > 0) {
      combineRecentItems()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentTransactions, transfers, accounts])

  // Calcular balance total
  const getTotalBalance = () => {
    return accounts.reduce(
      (total, account) => total + (account.currentBalance || 0),
      0
    )
  }

  // Calcular estadísticas de ingresos y gastos del mes
  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyTransactions = allTransactions.filter((transaction) => {
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
        <h1 className="text-2xl font-bold">Overview</h1>

        {/* Balance Total y Estadísticas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {getTotalBalance().toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-muted-foreground text-xs">
                Across {accounts.length} account
                {accounts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +$
                {monthlyStats.income.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -$
                {monthlyStats.expenses.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
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
                {(monthlyStats.income - monthlyStats.expenses).toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </div>
              <p className="text-muted-foreground text-xs">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions and Transfers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest 5 transactions and transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No transactions or transfers found. Create your first one!
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
                            : item.note || 'Transfer'}
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
                        ${Number(item.amount).toFixed(2)}
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

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>Overview of all your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No accounts found. Create your first account!
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
                          Balance
                        </p>
                        <p className="text-xl font-bold">
                          $
                          {Number(account.currentBalance).toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
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
