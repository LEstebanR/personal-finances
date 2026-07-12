'use client'

import { getAccounts } from '@/app/dashboard/accounts/actions'
import {
  createTransaction,
  createTransfer,
  getTransactions,
  getTransfers,
} from '@/app/dashboard/transactions/actions'
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
  name: string
  type: string
  isArchived: boolean
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

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)
  const [transactionType, setTransactionType] = useState<string>('')

  const loadTransactionsAndTransfers = async () => {
    try {
      const [transactions, transfers] = await Promise.all([
        getTransactions(),
        getTransfers(),
      ])
      setTransactions(transactions)
      setTransfers(transfers)
    } catch (error) {
      console.error('Error loading transactions/transfers:', error)
    }
  }

  const loadAvailableAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const accounts = await getAccounts()
      setAvailableAccounts(accounts.filter((account) => !account.isArchived))
    } catch (error) {
      console.error('Error loading available accounts:', error)
    }
    setLoadingAccounts(false)
  }

  useEffect(() => {
    Promise.all([
      loadTransactionsAndTransfers(),
      loadAvailableAccounts(),
    ]).finally(() => setLoading(false))
  }, [])

  // Combinar transacciones y transferencias cuando cambien
  useEffect(() => {
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

    const combined = [...transactionItems, ...transferItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setCombinedItems(combined)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const type = formData.get('type') as string

    try {
      if (type === 'transfer') {
        const fromAccountId = formData.get('fromAccountId') as string
        const toAccountId = formData.get('toAccountId') as string
        const amount = parseFloat(formData.get('amount') as string)

        await createTransfer(formData)

        const fromAccount = availableAccounts.find(
          (a) => a.id === fromAccountId
        )
        const toAccount = availableAccounts.find((a) => a.id === toAccountId)

        toast.success('Transfer completed successfully!', {
          description: `$${amount.toFixed(2)} from ${fromAccount?.name || 'Account'} to ${toAccount?.name || 'Account'}`,
        })
      } else {
        const accountId = formData.get('accountId') as string
        const amount = parseFloat(formData.get('amount') as string)

        await createTransaction(formData)

        const account = availableAccounts.find((a) => a.id === accountId)
        const typeLabel = type === 'income' ? 'Income' : 'Expense'

        toast.success(`${typeLabel} transaction created!`, {
          description: `${type === 'income' ? '+' : '-'}$${amount.toFixed(2)} • ${account?.name || 'Account'}`,
        })
      }

      await loadTransactionsAndTransfers()
      e.currentTarget?.reset()
      setTransactionType('')
      setIsDialogOpen(false)
      setCurrentPage(1)
    } catch (error) {
      console.error('Error creating transaction/transfer:', error)
      toast.error('Failed to save. Please try again.')
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
