'use client'

import { supabaseClient } from '@/utils/supabase'
import { User } from '@supabase/supabase-js'
import { Loader, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'

interface Account {
  id: string
  userId: string
  name: string
  type: string
  initialBalance: number | string
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

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)

  // Función para cargar transacciones
  const loadTransactions = async (currentUser: User) => {
    const supabase = supabaseClient()
    const { data: transactions, error } = await supabase
      .from('Transaction')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading transactions:', error)
    } else {
      setTransactions(transactions || [])
    }
  }

  // Función para cargar cuentas disponibles para el select
  const loadAvailableAccounts = async () => {
    if (!user) return

    setLoadingAccounts(true)
    const supabase = supabaseClient()
    const { data: accounts, error } = await supabase
      .from('Account')
      .select('*')
      .eq('userId', user.id)
      .eq('isArchived', false)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading available accounts:', error)
    } else {
      setAvailableAccounts(accounts || [])
    }
    setLoadingAccounts(false)
  }

  // Obtener usuario y transacciones al montar el componente
  useEffect(() => {
    const loadUserAndTransactions = async () => {
      const supabase = supabaseClient()

      // Obtener usuario
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await loadTransactions(user)
      }

      setLoading(false)
    }

    loadUserAndTransactions()
  }, [])

  // Filtrar transacciones por tipo
  const filterTransactionsByType = (type: 'all' | 'income' | 'expense') => {
    if (type === 'all') return transactions
    return transactions.filter((transaction) => transaction.type === type)
  }

  // Paginación
  const paginate = (transactions: Transaction[], page: number) => {
    const startIndex = (page - 1) * transactionsPerPage
    const endIndex = startIndex + transactionsPerPage
    return transactions.slice(startIndex, endIndex)
  }

  const getTotalPages = (transactions: Transaction[]) => {
    return Math.ceil(transactions.length / transactionsPerPage)
  }

  // Función para actualizar el balance de una cuenta
  const updateAccountBalance = async (
    accountId: string,
    amount: number,
    type: string
  ) => {
    const supabase = supabaseClient()

    console.log(
      `Updating balance for account: ${accountId}, amount: ${amount}, type: ${type}`
    )

    // Obtener la cuenta - usar solo initialBalance por ahora para evitar problemas con currentBalance
    const { data: account, error: fetchError } = await supabase
      .from('Account')
      .select('id, name, initialBalance')
      .eq('id', accountId)
      .single()

    if (fetchError) {
      console.error('Error fetching account:', fetchError)
      console.error('Full error object:', JSON.stringify(fetchError, null, 2))
      console.error('Account ID being searched:', accountId)
      console.error('Type of accountId:', typeof accountId)
      return
    }

    if (!account) {
      console.error('Account not found with ID:', accountId)
      return
    }

    console.log('Account found:', account)

    // Por ahora usar initialBalance como currentBalance hasta que se resuelva el schema
    const currentBalance = account.initialBalance ?? 0
    const newBalance =
      type === 'income' ? currentBalance + amount : currentBalance - amount

    console.log(
      `Balance calculation: ${currentBalance} ${type === 'income' ? '+' : '-'} ${amount} = ${newBalance}`
    )

    // Actualizar el balance en la base de datos (usando initialBalance por ahora)
    const { error: updateError } = await supabase
      .from('Account')
      .update({ initialBalance: newBalance })
      .eq('id', accountId)

    if (updateError) {
      console.error('Error updating account balance:', updateError)
    } else {
      console.log(
        `Account balance updated successfully: ${currentBalance} -> ${newBalance}`
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const supabase = supabaseClient()

    if (!user) {
      console.error('User not authenticated')
      setIsSubmitting(false)
      return
    }

    const transactionData = {
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: formData.get('accountId') as string,
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string,
      category: (formData.get('category') as string) || null,
    }

    console.log('Transaction Data to insert:', transactionData)

    const { data, error } = await supabase
      .from('Transaction')
      .insert([transactionData])
      .select()

    if (error) {
      console.error('Insert error:', error)
    } else {
      console.log('Transaction created successfully:', data)

      // Actualizar el balance de la cuenta
      await updateAccountBalance(
        transactionData.accountId,
        transactionData.amount,
        transactionData.type
      )

      // Recargar transacciones después de crear
      if (user) {
        await loadTransactions(user)
      }
      // Reset form
      e.currentTarget?.reset()
      // Cerrar el diálogo
      setIsDialogOpen(false)
      // Reset pagination
      setCurrentPage(1)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (open) {
              loadAvailableAccounts()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="size-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Create a new transaction to track your money.
            </DialogDescription>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <Label>Account</Label>
                <Select name="accountId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingAccounts
                          ? 'Loading accounts...'
                          : 'Select an account'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Transaction Type</Label>
                <Select name="type" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Amount</Label>
                <Input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Category (Optional)</Label>
                <Input type="text" name="category" placeholder="Category" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="Description"
                  className="resize-none"
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating Transaction...
                  </>
                ) : (
                  'Add Transaction'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de transacciones con tabs */}
      <div className="mt-6 w-full">
        {loading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-500">
            No transactions found. Create your first transaction!
          </p>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="income">
                Income ({filterTransactionsByType('income').length})
              </TabsTrigger>
              <TabsTrigger value="expense">
                Expenses ({filterTransactionsByType('expense').length})
              </TabsTrigger>
            </TabsList>

            {['all', 'income', 'expense'].map((tabType) => {
              const filteredTransactions = filterTransactionsByType(
                tabType as 'all' | 'income' | 'expense'
              )
              const paginatedTransactions = paginate(
                filteredTransactions,
                currentPage
              )
              const totalPages = getTotalPages(filteredTransactions)

              return (
                <TabsContent key={tabType} value={tabType} className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {transaction.description}
                            </TableCell>
                            <TableCell>
                              {transaction.category ? (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                  {transaction.category}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  transaction.type === 'income'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {transaction.type}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-bold ${
                                  transaction.type === 'income'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {transaction.type === 'income' ? '+' : '-'}$
                                {Number(transaction.amount).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {(currentPage - 1) * transactionsPerPage + 1} to{' '}
                        {Math.min(
                          currentPage * transactionsPerPage,
                          filteredTransactions.length
                        )}{' '}
                        of {filteredTransactions.length} transactions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>
    </div>
  )
}
