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

export function Overview() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  )
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

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
      console.error('Error loading accounts:', error)
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
    }
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
        ])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Calcular balance total
  const getTotalBalance = () => {
    return accounts.reduce(
      (total, account) => total + (account.initialBalance || 0),
      0
    )
  }

  // Obtener nombre de cuenta para transacciones
  const getAccountName = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId)
    return account?.name || 'Unknown Account'
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

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest 5 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No transactions found. Create your first transaction!
              </p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-muted-foreground text-sm">
                          {getAccountName(transaction.accountId)}
                          {transaction.category && ` • ${transaction.category}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}$
                        {Number(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
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
                          {Number(account.initialBalance).toLocaleString(
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
