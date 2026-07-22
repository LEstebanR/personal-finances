'use client'

import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useAccounts, useTransactions, useTransfers } from '@/lib/queries'
import {
  ArrowDown,
  ArrowUp,
  CreditCard,
  Loader,
  PlusIcon,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '../ui/button'
import { DatePicker } from '../ui/date-picker'
import { Input } from '../ui/input'
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
import { AddTransactionDialog } from './add-transaction-dialog'
import {
  EditTransactionDialog,
  type EditableItem,
} from './edit-transaction-dialog'
import { TransactionRowActions } from './transaction-row-actions'

const ALL = 'all'

interface Transaction {
  id: string
  accountId: string | null
  debtId: string | null
  amount: number
  type: string
  description: string
  date: Date
  categoryId: string
  subcategoryId: string | null
  categoryName: string
  subcategoryName: string | null
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
    debtId: item.debtId,
    amount: item.amount,
    type: item.type,
    description: item.description,
    date: item.date,
    categoryId: item.categoryId,
    subcategoryId: item.subcategoryId,
  }
}

export function Transactions() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { data: transactions = [], isLoading: loadingTransactions } =
    useTransactions()
  const { data: transfers = [], isLoading: loadingTransfers } = useTransfers()
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts()
  const loading = loadingTransactions || loadingTransfers || loadingAccounts
  const [currentPage, setCurrentPage] = useState(1)
  const [transactionsPerPage] = useState(10)
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [accountFilter, setAccountFilter] = useState(ALL)
  const [categoryFilter, setCategoryFilter] = useState(ALL)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  const combinedItems = useMemo(() => {
    const accountMap = new Map<string, string>()
    for (const account of accounts) {
      accountMap.set(account.id, account.name)
    }

    const transactionItems: CombinedItem[] = transactions.map((tItem) => ({
      ...tItem,
      itemType: 'transaction' as const,
    }))

    const transferItems: CombinedItem[] = transfers.map((tItem) => ({
      ...tItem,
      itemType: 'transfer' as const,
      fromAccountName: accountMap.get(tItem.fromAccountId),
      toAccountName: accountMap.get(tItem.toAccountId),
    }))

    return [...transactionItems, ...transferItems].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })
  }, [accounts, transactions, transfers, sortOrder])

  const accountOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of combinedItems) {
      if (item.itemType === 'transaction') {
        const id = item.accountId ?? item.debtId
        if (id && item.sourceName) map.set(id, item.sourceName)
      } else {
        if (item.fromAccountName)
          map.set(item.fromAccountId, item.fromAccountName)
        if (item.toAccountName) map.set(item.toAccountId, item.toAccountName)
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [combinedItems])

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of combinedItems) {
      if (item.itemType === 'transaction' && item.categoryName) {
        map.set(item.categoryId, item.categoryName)
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [combinedItems])

  const hasActiveFilters =
    search.trim() !== '' ||
    accountFilter !== ALL ||
    categoryFilter !== ALL ||
    dateFrom !== undefined ||
    dateTo !== undefined

  const clearFilters = () => {
    setSearch('')
    setAccountFilter(ALL)
    setCategoryFilter(ALL)
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const filteredCombinedItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const from = dateFrom
      ? new Date(
          Date.UTC(
            dateFrom.getFullYear(),
            dateFrom.getMonth(),
            dateFrom.getDate()
          )
        )
      : null
    const to = dateTo
      ? new Date(
          Date.UTC(
            dateTo.getFullYear(),
            dateTo.getMonth(),
            dateTo.getDate(),
            23,
            59,
            59
          )
        )
      : null

    return combinedItems.filter((item) => {
      if (accountFilter !== ALL) {
        const matchesAccount =
          item.itemType === 'transaction'
            ? item.accountId === accountFilter || item.debtId === accountFilter
            : item.fromAccountId === accountFilter ||
              item.toAccountId === accountFilter
        if (!matchesAccount) return false
      }

      if (categoryFilter !== ALL) {
        if (
          item.itemType !== 'transaction' ||
          item.categoryId !== categoryFilter
        )
          return false
      }

      const itemDate = new Date(item.date)
      if (from && itemDate < from) return false
      if (to && itemDate > to) return false

      if (query) {
        const text =
          item.itemType === 'transaction'
            ? (item.description || item.categoryName || '').toLowerCase()
            : (item.note || '').toLowerCase()
        if (!text.includes(query)) return false
      }

      return true
    })
  }, [combinedItems, accountFilter, categoryFilter, dateFrom, dateTo, search])

  useEffect(() => {
    setCurrentPage(1)
  }, [accountFilter, categoryFilter, dateFrom, dateTo, search, sortOrder])

  const filterItemsByType = (
    type: 'all' | 'income' | 'expense' | 'transfer'
  ) => {
    if (type === 'all') return filteredCombinedItems
    if (type === 'transfer') {
      return filteredCombinedItems.filter(
        (item) => item.itemType === 'transfer'
      )
    }
    return filteredCombinedItems.filter(
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

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CreditCard className="mb-4 h-16 w-16 text-gray-300" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {t('transactions.noItemsFound')}
      </h3>
      <p className="mb-6 max-w-sm text-gray-500">
        {t('transactions.noItemsFoundDesc')}
      </p>
      <AddTransactionDialog
        trigger={
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            {t('transactions.addTransaction')}
          </Button>
        }
      />
    </div>
  )

  const NoResultsState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CreditCard className="mb-4 h-16 w-16 text-gray-300" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {t('transactions.noResultsFiltered')}
      </h3>
      <p className="mb-6 max-w-sm text-gray-500">
        {t('transactions.noResultsFilteredDesc')}
      </p>
      <Button variant="outline" onClick={clearFilters}>
        <X className="mr-2 h-4 w-4" />
        {t('transactions.clearFilters')}
      </Button>
    </div>
  )

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

      {!loading && combinedItems.length > 0 && (
        <div className="mt-6 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder={t('transactions.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:col-span-2"
          />
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('transactions.allAccounts')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('transactions.allAccounts')}
              </SelectItem>
              {accountOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('transactions.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('transactions.allCategories')}
              </SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder={t('transactions.dateFrom')}
            />
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder={t('transactions.dateTo')}
            />
          </div>
          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`justify-self-start lg:col-span-5 ${
              hasActiveFilters ? '' : 'invisible'
            }`}
          >
            <X className="mr-2 h-4 w-4" />
            {t('transactions.clearFilters')}
          </Button>
        </div>
      )}

      <div className="mt-6 w-full">
        {loading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : combinedItems.length === 0 ? (
          <EmptyState />
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
                    hasActiveFilters ? (
                      <NoResultsState />
                    ) : (
                      <EmptyState />
                    )
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
                                <button
                                  type="button"
                                  className="flex items-center gap-1"
                                  onClick={() =>
                                    setSortOrder((prev) =>
                                      prev === 'asc' ? 'desc' : 'asc'
                                    )
                                  }
                                  aria-label={t('transactions.sortByDate')}
                                >
                                  {t('transactions.table.date')}
                                  {sortOrder === 'asc' ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  )}
                                </button>
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
                                    ? item.description || item.categoryName
                                    : item.note || t('overview.transfer')}
                                </TableCell>
                                <TableCell>
                                  {item.itemType === 'transaction' ? (
                                    item.sourceName || '-'
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
                                    ? item.categoryName || '-'
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
                                    : ''}
                                  ${formatMoney(Number(item.amount), currency)}
                                </TableCell>
                                <TableCell>
                                  {new Date(item.date).toLocaleDateString(
                                    undefined,
                                    { timeZone: 'UTC' }
                                  )}
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
