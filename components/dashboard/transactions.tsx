'use client'

import { getAccounts } from '@/app/dashboard/accounts/actions'
import {
  getTransactions,
  getTransfers,
} from '@/app/dashboard/transactions/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { Loader, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AddTransactionDialog } from './add-transaction-dialog'
import {
  EditTransactionDialog,
  type EditableItem,
} from './edit-transaction-dialog'
import { useDashboardRefresh } from './refresh-provider'
import { TransactionRowActions } from './transaction-row-actions'

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

interface AccountName {
  id: string
  name: string
}

type CombinedItem =
  | (Transaction & { itemType: 'transaction'; accountName?: string })
  | (Transfer & {
      itemType: 'transfer'
      fromAccountName?: string
      toAccountName?: string
    })

function toEditableItem(item: CombinedItem): EditableItem {
  if (item.itemType === 'transfer') {
    return {
      itemType: 'transfer',
      id: item.id,
      fromAccountId: item.fromAccountId,
      toAccountId: item.toAccountId,
      amount: item.amount,
      date: item.date,
      note: item.note,
    }
  }
  return {
    itemType: 'transaction',
    id: item.id,
    accountId: item.accountId,
    amount: item.amount,
    type: item.type,
    description: item.description,
    date: item.date,
    category: item.category,
  }
}

export function Transactions() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { refreshKey } = useDashboardRefresh()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [accounts, setAccounts] = useState<AccountName[]>([])
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [accountsData, transactionsData, transfersData] =
          await Promise.all([getAccounts(), getTransactions(), getTransfers()])
        setAccounts(accountsData)
        setTransactions(transactionsData)
        setTransfers(transfersData)
      } catch (error) {
        console.error('Error loading transactions/transfers:', error)
      }
      setLoading(false)
    }

    load()
  }, [refreshKey])

  useEffect(() => {
    const accountMap = new Map<string, string>()
    for (const account of accounts) {
      accountMap.set(account.id, account.name)
    }

    const transactionItems: CombinedItem[] = transactions.map((tItem) => ({
      ...tItem,
      itemType: 'transaction' as const,
      accountName: accountMap.get(tItem.accountId),
    }))

    const transferItems: CombinedItem[] = transfers.map((tItem) => ({
      ...tItem,
      itemType: 'transfer' as const,
      fromAccountName: accountMap.get(tItem.fromAccountId),
      toAccountName: accountMap.get(tItem.toAccountId),
    }))

    const combined = [...transactionItems, ...transferItems].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setCombinedItems(combined)
  }, [transactions, transfers, accounts])

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

  const paginate = (items: CombinedItem[], page: number) => {
    const startIndex = (page - 1) * transactionsPerPage
    const endIndex = startIndex + transactionsPerPage
    return items.slice(startIndex, endIndex)
  }

  const getTotalPages = (items: CombinedItem[]) => {
    return Math.ceil(items.length / transactionsPerPage)
  }

  const handleEdit = (item: EditableItem) => {
    setEditingItem(item)
    setIsEditOpen(true)
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full justify-between">
        <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
        <AddTransactionDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              {t('transactions.addTransaction')}
            </Button>
          }
        />
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : combinedItems.length === 0 ? (
          <p className="text-center text-gray-500">
            {t('transactions.noItemsFound')}
          </p>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                {t('transactions.all')} ({combinedItems.length})
              </TabsTrigger>
              <TabsTrigger value="income">
                {t('transactions.income')} ({filterItemsByType('income').length}
                )
              </TabsTrigger>
              <TabsTrigger value="expense">
                {t('transactions.expense')} (
                {filterItemsByType('expense').length})
              </TabsTrigger>
              <TabsTrigger value="transfer">
                {t('transactions.transfer')} (
                {filterItemsByType('transfer').length})
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
                  {filteredItems.length === 0 ? (
                    <p className="text-center text-gray-500">
                      {t('transactions.noItemsFound')}
                    </p>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                {t('transactions.table.description')}
                              </TableHead>
                              <TableHead>
                                {t('transactions.table.account')}
                              </TableHead>
                              <TableHead>
                                {t('transactions.table.type')}
                              </TableHead>
                              <TableHead>
                                {t('transactions.table.category')}
                              </TableHead>
                              <TableHead>
                                {t('transactions.table.amount')}
                              </TableHead>
                              <TableHead>
                                {t('transactions.table.date')}
                              </TableHead>
                              <TableHead className="text-right">
                                {t('transactions.table.actions')}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.itemType === 'transaction'
                                    ? item.description
                                    : item.note || t('overview.transfer')}
                                </TableCell>
                                <TableCell>
                                  {item.itemType === 'transaction' ? (
                                    item.accountName || '-'
                                  ) : (
                                    <span className="text-xs">
                                      {item.fromAccountName} →{' '}
                                      {item.toAccountName}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {item.itemType === 'transaction' ? (
                                    <span
                                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                        item.type === 'income'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {item.type === 'income'
                                        ? t('transactions.income')
                                        : t('transactions.expense')}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                      {t('overview.transfer')}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-gray-500">
                                  {item.itemType === 'transaction'
                                    ? item.category || '-'
                                    : '-'}
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
                                  ${formatMoney(Number(item.amount), currency)}
                                </TableCell>
                                <TableCell>
                                  {new Date(item.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <TransactionRowActions
                                    item={toEditableItem(item)}
                                    onEdit={handleEdit}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-gray-700">
                            {t('transactions.showing')}{' '}
                            {(currentPage - 1) * transactionsPerPage + 1}{' '}
                            {t('transactions.to')}{' '}
                            {Math.min(
                              currentPage * transactionsPerPage,
                              filteredItems.length
                            )}{' '}
                            {t('transactions.of')} {filteredItems.length}{' '}
                            {t('transactions.items')}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              {t('transactions.previous')}
                            </Button>
                            <span className="flex items-center px-4 text-sm">
                              {t('transactions.page')} {currentPage}{' '}
                              {t('transactions.of')} {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              {t('transactions.next')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>

      <EditTransactionDialog
        item={editingItem}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </div>
  )
}
