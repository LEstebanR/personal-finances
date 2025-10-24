'use client'

import { supabaseClient } from '@/utils/supabase'
import { User } from '@supabase/supabase-js'
import { Loader, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
  currentBalance: number | string
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

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)
  const [transactionType, setTransactionType] = useState<string>('')

  // Función para cargar transacciones
  const loadTransactions = async (currentUser: User) => {
    const supabase = supabaseClient()
    console.log('Loading transactions for user:', currentUser.id)
    const { data: transactions, error } = await supabase
      .from('Transaction')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading transactions:', error)
      console.error('Full error:', JSON.stringify(error, null, 2))
    } else {
      console.log(
        'Transactions loaded:',
        transactions?.length || 0,
        transactions
      )
      setTransactions(transactions || [])
    }
  }

  // Función para cargar transferencias
  const loadTransfers = async (currentUser: User) => {
    const supabase = supabaseClient()
    console.log('Loading transfers for user:', currentUser.id)
    const { data: transfers, error } = await supabase
      .from('Transfer')
      .select('*')
      .eq('userId', currentUser.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error loading transfers:', error)
      console.error('Full error:', JSON.stringify(error, null, 2))
    } else {
      console.log('Transfers loaded:', transfers?.length || 0, transfers)
      setTransfers(transfers || [])
    }
  }

  // Función para combinar transacciones y transferencias
  const combineTransactionsAndTransfers = async () => {
    console.log(
      'Combining items - Transactions:',
      transactions.length,
      'Transfers:',
      transfers.length,
      'Accounts:',
      availableAccounts.length
    )

    // Crear un mapa de nombres de cuentas
    const accountMap = new Map<string, string>()
    for (const account of availableAccounts) {
      accountMap.set(account.id, account.name)
    }

    const transactionItems: CombinedItem[] = transactions.map((t) => ({
      ...t,
      itemType: 'transaction' as const,
      accountName: accountMap.get(t.accountId),
    }))

    const transferItems: CombinedItem[] = transfers.map((t) => ({
      ...t,
      itemType: 'transfer' as const,
      fromAccountName: accountMap.get(t.fromAccountId),
      toAccountName: accountMap.get(t.toAccountId),
    }))

    // Combinar y ordenar por fecha de creación
    const combined = [...transactionItems, ...transferItems].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    console.log('Combined items:', combined.length)
    setCombinedItems(combined)
  }

  // Función para cargar cuentas disponibles para el select
  const loadAvailableAccounts = async () => {
    const supabase = supabaseClient()

    // Obtener el usuario actual si no está disponible
    const currentUser = user || (await supabase.auth.getUser()).data.user
    if (!currentUser) return

    setLoadingAccounts(true)
    const { data: accounts, error } = await supabase
      .from('Account')
      .select('*')
      .eq('userId', currentUser.id)
      .eq('isArchived', false)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading available accounts:', error)
    } else {
      console.log('Available accounts loaded:', accounts?.length || 0)
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
        await loadTransfers(user)
        // Cargar cuentas disponibles para mapear nombres
        await loadAvailableAccounts()
      }

      setLoading(false)
    }

    loadUserAndTransactions()
  }, [])

  // Combinar transacciones y transferencias cuando cambien
  useEffect(() => {
    // Combinar incluso si availableAccounts está vacío
    // Los nombres se mostrarán cuando las cuentas se carguen
    if (transactions.length > 0 || transfers.length > 0) {
      combineTransactionsAndTransfers()
    }
    console.log(
      'Rendering - combinedItems:',
      combinedItems.length,
      'loading:',
      loading,
      'transactions:',
      transactions.length,
      'transfers:',
      transfers.length
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, transfers, availableAccounts])

  // Filtrar items combinados por tipo
  const filterItemsByType = (
    type: 'all' | 'income' | 'expense' | 'transfer'
  ) => {
    if (type === 'all') return combinedItems
    if (type === 'transfer') {
      return combinedItems.filter((item) => item.itemType === 'transfer')
    }
    return combinedItems.filter(
      (item) => item.itemType === 'transaction' && item.type === type
    )
  }

  // Paginación
  const paginate = (items: CombinedItem[], page: number) => {
    const startIndex = (page - 1) * transactionsPerPage
    const endIndex = startIndex + transactionsPerPage
    return items.slice(startIndex, endIndex)
  }

  const getTotalPages = (items: CombinedItem[]) => {
    return Math.ceil(items.length / transactionsPerPage)
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

    // Obtener la cuenta con su balance actual
    const { data: account, error: fetchError } = await supabase
      .from('Account')
      .select('id, name, currentBalance')
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

    // Obtener el balance actual de la cuenta
    const currentBalance = account.currentBalance ?? 0
    const newBalance =
      type === 'income' ? currentBalance + amount : currentBalance - amount

    console.log(
      `Balance calculation: ${currentBalance} ${type === 'income' ? '+' : '-'} ${amount} = ${newBalance}`
    )

    // Actualizar el balance actual en la base de datos
    const { error: updateError } = await supabase
      .from('Account')
      .update({ currentBalance: newBalance })
      .eq('id', accountId)

    if (updateError) {
      console.error('Error updating account balance:', updateError)
    } else {
      console.log(
        `Account balance updated successfully: ${currentBalance} -> ${newBalance}`
      )
    }
  }

  // Función para actualizar balances en una transferencia
  const updateBalancesForTransfer = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ) => {
    const supabase = supabaseClient()

    // Obtener ambas cuentas
    const { data: fromAccount, error: fromError } = await supabase
      .from('Account')
      .select('id, name, currentBalance')
      .eq('id', fromAccountId)
      .single()

    const { data: toAccount, error: toError } = await supabase
      .from('Account')
      .select('id, name, currentBalance')
      .eq('id', toAccountId)
      .single()

    if (fromError || toError || !fromAccount || !toAccount) {
      console.error('Error fetching accounts:', fromError || toError)
      return false
    }

    // Calcular nuevos balances
    const fromNewBalance = (fromAccount.currentBalance ?? 0) - amount
    const toNewBalance = (toAccount.currentBalance ?? 0) + amount

    console.log(
      `Transfer: ${fromAccount.name} (${fromAccount.currentBalance}) - ${amount} = ${fromNewBalance}`
    )
    console.log(
      `Transfer: ${toAccount.name} (${toAccount.currentBalance}) + ${amount} = ${toNewBalance}`
    )

    // Actualizar ambas cuentas
    const { error: fromUpdateError } = await supabase
      .from('Account')
      .update({ currentBalance: fromNewBalance })
      .eq('id', fromAccountId)

    const { error: toUpdateError } = await supabase
      .from('Account')
      .update({ currentBalance: toNewBalance })
      .eq('id', toAccountId)

    if (fromUpdateError || toUpdateError) {
      console.error(
        'Error updating balances:',
        fromUpdateError || toUpdateError
      )
      return false
    }

    console.log('Balances updated successfully')
    return true
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

    const type = formData.get('type') as string

    // Si es una transferencia, usar la tabla Transfer
    if (type === 'transfer') {
      const fromAccountId = formData.get('fromAccountId') as string
      const toAccountId = formData.get('toAccountId') as string
      const amount = parseFloat(formData.get('amount') as string)
      const note = formData.get('description') as string
      const date = formData.get('date') as string

      const transferData = {
        id: crypto.randomUUID(),
        userId: user.id,
        fromAccountId: fromAccountId,
        toAccountId: toAccountId,
        amount: amount,
        date: date,
        note: note,
      }

      console.log('Transfer Data to insert:', transferData)

      const { data, error } = await supabase
        .from('Transfer')
        .insert([transferData])
        .select()

      if (error) {
        console.error('Transfer error:', error)
        toast.error('Failed to create transfer. Please try again.')
      } else {
        console.log('Transfer created successfully:', data)

        // Actualizar balances de ambas cuentas
        const success = await updateBalancesForTransfer(
          fromAccountId,
          toAccountId,
          amount
        )

        if (success && user) {
          await loadTransactions(user)
          await loadTransfers(user)

          // Encontrar nombres de cuentas para el toast
          const fromAccount = availableAccounts.find(
            (a) => a.id === fromAccountId
          )
          const toAccount = availableAccounts.find((a) => a.id === toAccountId)

          toast.success('Transfer completed successfully!', {
            description: `$${amount.toFixed(2)} from ${fromAccount?.name || 'Account'} to ${toAccount?.name || 'Account'}`,
          })
        } else {
          toast.error('Transfer created but failed to update balances.')
        }

        // Reset form
        e.currentTarget?.reset()
        setTransactionType('')
        // Cerrar el diálogo
        setIsDialogOpen(false)
        // Reset pagination
        setCurrentPage(1)
      }
    } else {
      // Transacción normal (income o expense)
      const transactionData = {
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: formData.get('accountId') as string,
        amount: parseFloat(formData.get('amount') as string),
        type: type,
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
        toast.error('Failed to create transaction. Please try again.')
      } else {
        console.log('Transaction created successfully:', data)

        // Actualizar el balance de la cuenta
        await updateAccountBalance(
          transactionData.accountId,
          transactionData.amount,
          transactionData.type
        )

        const account = availableAccounts.find(
          (a) => a.id === transactionData.accountId
        )
        const typeLabel =
          transactionData.type === 'income' ? 'Income' : 'Expense'

        toast.success(`${typeLabel} transaction created!`, {
          description: `${transactionData.type === 'income' ? '+' : '-'}$${transactionData.amount.toFixed(2)} • ${account?.name || 'Account'}`,
        })

        // Recargar transacciones después de crear
        if (user) {
          await loadTransactions(user)
          await loadTransfers(user)
        }
        // Reset form
        e.currentTarget?.reset()
        setTransactionType('')
        // Cerrar el diálogo
        setIsDialogOpen(false)
        // Reset pagination
        setCurrentPage(1)
      }
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
            } else {
              setTransactionType('')
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
                <Label>Transaction Type</Label>
                <Select
                  name="type"
                  required
                  onValueChange={(value) => setTransactionType(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transactionType === 'transfer' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <Label>From Account</Label>
                    <Select name="fromAccountId" required>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingAccounts
                              ? 'Loading accounts...'
                              : 'Select source account'
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
                    <Label>To Account</Label>
                    <Select name="toAccountId" required>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingAccounts
                              ? 'Loading accounts...'
                              : 'Select destination account'
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
                </>
              ) : (
                transactionType && (
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
                )
              )}
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
              {transactionType !== 'transfer' && (
                <div className="flex flex-col gap-1">
                  <Label>Category (Optional)</Label>
                  <Input type="text" name="category" placeholder="Category" />
                </div>
              )}
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

      {/* Lista de transacciones y transferencias con tabs */}
      <div className="mt-6 w-full">
        {loading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : combinedItems.length === 0 ? (
          <p className="text-center text-gray-500">
            No transactions or transfers found. Create your first one!
          </p>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({combinedItems.length})
              </TabsTrigger>
              <TabsTrigger value="income">
                Income ({filterItemsByType('income').length})
              </TabsTrigger>
              <TabsTrigger value="expense">
                Expenses ({filterItemsByType('expense').length})
              </TabsTrigger>
              <TabsTrigger value="transfer">
                Transfers ({filterItemsByType('transfer').length})
              </TabsTrigger>
            </TabsList>

            {['all', 'income', 'expense', 'transfer'].map((tabType) => {
              const filteredItems = filterItemsByType(
                tabType as 'all' | 'income' | 'expense' | 'transfer'
              )
              const paginatedItems = paginate(filteredItems, currentPage)
              const totalPages = getTotalPages(filteredItems)

              return (
                <TabsContent key={tabType} value={tabType} className="mt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Category/Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.itemType === 'transaction'
                                ? item.description
                                : item.note || 'Transfer'}
                            </TableCell>
                            <TableCell>
                              {item.itemType === 'transaction' ? (
                                item.accountName || '-'
                              ) : (
                                <span className="text-xs">
                                  {item.fromAccountName} → {item.toAccountName}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.itemType === 'transaction' ? (
                                <>
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                      item.type === 'income'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.type}
                                  </span>
                                  <div className="mt-1 text-xs text-gray-500">
                                    {item.category || '-'}
                                  </div>
                                </>
                              ) : (
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                  Transfer
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              className={
                                item.itemType === 'transaction'
                                  ? item.type === 'income'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                  : 'text-blue-600'
                              }
                            >
                              {item.itemType === 'transaction' &&
                              item.type === 'income'
                                ? '+'
                                : item.itemType === 'transaction'
                                  ? '-'
                                  : ''}
                              $
                              {Number(item.amount).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>
                              {new Date(item.date).toLocaleDateString()}
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
                          filteredItems.length
                        )}{' '}
                        of {filteredItems.length} items
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
