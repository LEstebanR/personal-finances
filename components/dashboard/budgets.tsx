'use client'

import { deleteBudgetItem } from '@/app/dashboard/budgets/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useBudgetItems, useBudgetOverview } from '@/lib/queries'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Loader,
  Pencil,
  PlusIcon,
  Repeat,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DayButton } from 'react-day-picker'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import {
  AddBudgetItemDialog,
  type EditableBudgetItem,
} from './add-budget-item-dialog'
import { useDashboardRefresh } from './refresh-provider'

// Budget item dates are stored as date-only values (UTC midnight). Reading
// them back with local getters (toDateString, toLocaleDateString without a
// timeZone) can shift the displayed day by one for negative UTC-offset
// timezones. These helpers keep the "intended" calendar day consistent:
// extract with UTC getters from a stored date, local getters from a
// calendar-grid date (which is already local midnight for that visible day).
function dbDateKey(date: Date | string) {
  const d = new Date(date)
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

const ITEMS_PER_PAGE = 10

const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

function BudgetDayButton({
  totals,
  currency,
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  totals: Map<string, number>
  currency: string
}) {
  const total = totals.get(localDateKey(day.date))

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      className={cn(
        'flex aspect-square h-full w-full min-w-(--cell-size) flex-col gap-0.5 leading-none font-normal',
        modifiers.today && 'bg-accent',
        modifiers.outside && 'text-muted-foreground',
        className
      )}
      {...props}
    >
      <span className="text-xs">{day.date.getDate()}</span>
      {total ? (
        <span className="text-primary text-[9px] leading-none font-semibold">
          {formatMoney(total, currency)}
        </span>
      ) : null}
    </Button>
  )
}

export function Budgets() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingItem, setEditingItem] = useState<EditableBudgetItem | null>(
    null
  )
  // Force a full remount of the dialog every time it opens, otherwise
  // reopening it for the same item reuses stale internal state (e.g. the
  // DatePicker keeps whatever date it last held instead of the fresh value).
  const [dialogKey, setDialogKey] = useState(0)
  const [occasionalPage, setOccasionalPage] = useState(1)
  const [recurringPage, setRecurringPage] = useState(1)

  const { data: items = [], isLoading: loadingItems } = useBudgetItems(
    month,
    year
  )
  const { data: categoryTotals = [], isLoading: loadingOverview } =
    useBudgetOverview(month, year)
  const loading = loadingItems || loadingOverview

  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      const key = dbDateKey(item.date)
      map.set(key, (map.get(key) ?? 0) + item.amount)
    }
    return map
  }, [items])

  const goToPreviousMonth = () => {
    setOccasionalPage(1)
    setRecurringPage(1)
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    setOccasionalPage(1)
    setRecurringPage(1)
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const occasionalItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.subscriptionId && !item.recurringExpenseId && !item.debtId
      ),
    [items]
  )
  const recurringItems = useMemo(
    () =>
      items.filter(
        (item) => item.subscriptionId || item.recurringExpenseId || item.debtId
      ),
    [items]
  )

  const occasionalTotalPages = Math.max(
    1,
    Math.ceil(occasionalItems.length / ITEMS_PER_PAGE)
  )
  const occasionalPageClamped = Math.min(occasionalPage, occasionalTotalPages)
  const paginatedOccasionalItems = occasionalItems.slice(
    (occasionalPageClamped - 1) * ITEMS_PER_PAGE,
    occasionalPageClamped * ITEMS_PER_PAGE
  )

  const recurringTotalPages = Math.max(
    1,
    Math.ceil(recurringItems.length / ITEMS_PER_PAGE)
  )
  const recurringPageClamped = Math.min(recurringPage, recurringTotalPages)
  const paginatedRecurringItems = recurringItems.slice(
    (recurringPageClamped - 1) * ITEMS_PER_PAGE,
    recurringPageClamped * ITEMS_PER_PAGE
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteBudgetItem(id)
      toast.success(t('budgets.itemDeleted'))
      triggerRefresh()
    } catch (error) {
      console.error('Error deleting budget item:', error)
      toast.error(t('budgets.itemDeleteFailed'))
    }
  }

  const totalBudgeted = categoryTotals.reduce(
    (sum, item) => sum + (item.amount ?? 0),
    0
  )
  const totalSpent = categoryTotals.reduce((sum, item) => sum + item.spent, 0)

  const openEdit = (item: (typeof items)[number]) => {
    setEditingItem({
      id: item.id,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      date: item.date,
      amount: item.amount,
      description: item.description,
      recurringExpenseId: item.recurringExpenseId,
      debtId: item.debtId,
    })
    setDialogKey((k) => k + 1)
    setIsAddOpen(true)
  }

  const BudgetItemRow = ({
    item,
    isRecurring,
  }: {
    item: (typeof items)[number]
    isRecurring: boolean
  }) => (
    <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-muted-foreground w-14 shrink-0 text-xs">
          {new Date(item.date).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            timeZone: 'UTC',
          })}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-medium">
            {isRecurring && (
              <Repeat className="text-muted-foreground h-3 w-3 shrink-0" />
            )}
            <span className="truncate">
              {item.description || item.categoryName}
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            {item.categoryName}
            {item.subcategoryName && ` • ${item.subcategoryName}`}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-medium">
          ${formatMoney(item.amount, currency)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => openEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive hover:text-destructive h-7 w-7"
          onClick={() => handleDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )

  const PaginationBar = ({
    page,
    totalPages,
    totalItems,
    onPrevious,
    onNext,
  }: {
    page: number
    totalPages: number
    totalItems: number
    onPrevious: () => void
    onNext: () => void
  }) => (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        {t('transactions.showing')} {(page - 1) * ITEMS_PER_PAGE + 1}{' '}
        {t('transactions.to')} {Math.min(page * ITEMS_PER_PAGE, totalItems)}{' '}
        {t('transactions.of')} {totalItems} {t('transactions.items')}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={page === 1}
        >
          {t('transactions.previous')}
        </Button>
        <span className="flex items-center px-4 text-sm">
          {t('transactions.page')} {page} {t('transactions.of')} {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page === totalPages}
        >
          {t('transactions.next')}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex w-full flex-col gap-6 rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">{t('budgets.title')}</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center font-medium">
            {t(`budgets.months.${MONTH_KEYS[month - 1]}`)} {year}
          </span>
          <Button size="icon" variant="outline" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader className="m-auto h-8 w-8 animate-spin" />
      ) : (
        <>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{t('budgets.cashFlow')}</h2>
                <p className="text-muted-foreground text-sm">
                  {t('budgets.cashFlowDesc')}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingItem(null)
                  setSelectedDate(
                    new Date(year, month - 1, Math.min(now.getDate(), 28))
                  )
                  setDialogKey((k) => k + 1)
                  setIsAddOpen(true)
                }}
              >
                <PlusIcon className="h-4 w-4" />
                {t('budgets.addItem')}
              </Button>
            </div>

            <Calendar
              mode="single"
              month={new Date(year, month - 1, 1)}
              selected={undefined}
              showOutsideDays={false}
              onSelect={(date) => {
                if (!date) return
                setEditingItem(null)
                setSelectedDate(date)
                setDialogKey((k) => k + 1)
                setIsAddOpen(true)
              }}
              className="w-full"
              classNames={{
                nav: 'hidden',
                month_caption: 'hidden',
                month: 'w-full',
                month_grid: 'w-full',
              }}
              components={{
                DayButton: (props) => (
                  <BudgetDayButton
                    {...props}
                    totals={dailyTotals}
                    currency={currency}
                  />
                ),
              }}
            />

            <AddBudgetItemDialog
              key={dialogKey}
              open={isAddOpen}
              onOpenChange={setIsAddOpen}
              defaultDate={selectedDate}
              item={editingItem}
              onSaved={triggerRefresh}
            />

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Wallet className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-muted-foreground text-sm">
                  {t('budgets.noItemsYet')}
                </p>
              </div>
            ) : (
              <>
                {occasionalItems.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      {t('budgets.occasionalExpenses')}
                    </h3>
                    <div className="space-y-1">
                      {paginatedOccasionalItems.map((item) => (
                        <BudgetItemRow
                          key={item.id}
                          item={item}
                          isRecurring={false}
                        />
                      ))}
                    </div>
                    {occasionalTotalPages > 1 && (
                      <PaginationBar
                        page={occasionalPageClamped}
                        totalPages={occasionalTotalPages}
                        totalItems={occasionalItems.length}
                        onPrevious={() =>
                          setOccasionalPage(occasionalPageClamped - 1)
                        }
                        onNext={() =>
                          setOccasionalPage(occasionalPageClamped + 1)
                        }
                      />
                    )}
                  </div>
                )}

                {recurringItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      {t('budgets.recurringExpenses')}
                    </h3>
                    <div className="space-y-1">
                      {paginatedRecurringItems.map((item) => (
                        <BudgetItemRow
                          key={item.id}
                          item={item}
                          isRecurring={true}
                        />
                      ))}
                    </div>
                    {recurringTotalPages > 1 && (
                      <PaginationBar
                        page={recurringPageClamped}
                        totalPages={recurringTotalPages}
                        totalItems={recurringItems.length}
                        onPrevious={() =>
                          setRecurringPage(recurringPageClamped - 1)
                        }
                        onNext={() =>
                          setRecurringPage(recurringPageClamped + 1)
                        }
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {categoryTotals.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold">{t('budgets.byCategory')}</h2>
              {totalBudgeted > 0 && (
                <p className="text-muted-foreground mb-3 text-sm">
                  {t('budgets.totalSpentOfBudget', {
                    spent: formatMoney(totalSpent, currency),
                    budget: formatMoney(totalBudgeted, currency),
                  })}
                </p>
              )}
              <div className="space-y-3">
                {categoryTotals.map((item) => {
                  const displayAmount = item.amount ?? 0
                  const percentSpent =
                    displayAmount > 0
                      ? Math.min(100, (item.spent / displayAmount) * 100)
                      : 0
                  const isOverBudget =
                    displayAmount > 0 && item.spent > displayAmount
                  const barColor = isOverBudget
                    ? 'bg-red-500'
                    : percentSpent >= 80
                      ? 'bg-yellow-500'
                      : 'bg-primary'

                  return (
                    <div
                      key={item.categoryId}
                      className="rounded-lg border p-3"
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{item.categoryName}</span>
                        <span className="text-muted-foreground">
                          ${formatMoney(item.spent, currency)} / $
                          {formatMoney(displayAmount, currency)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${percentSpent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
