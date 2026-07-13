'use client'

import { getBudgetOverview, setBudget } from '@/app/dashboard/budgets/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney, parseCurrencyInput } from '@/lib/currency'
import { ChevronLeft, ChevronRight, Loader, PiggyBank } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/currency-input'
import { useDashboardRefresh } from './refresh-provider'

interface CategoryBudget {
  categoryId: string
  categoryName: string
  budgetId: string | null
  amount: number | null
  suggestedAmount: number | null
  spent: number
}

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

function BudgetRow({
  item,
  month,
  year,
  currency,
  onSaved,
}: {
  item: CategoryBudget
  month: number
  year: number
  currency: string
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const [isSaving, setIsSaving] = useState(false)
  const isSuggested = item.amount === null && item.suggestedAmount !== null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amountInput = formData.get(`budget-${item.categoryId}`)
    const amount = parseCurrencyInput(amountInput)
    if (Number.isNaN(amount) || amount === item.amount) return

    setIsSaving(true)
    try {
      await setBudget(item.categoryId, month, year, amountInput ?? '')
      toast.success(t('budgets.saveSuccess'))
      onSaved()
    } catch (error) {
      console.error('Error saving budget:', error)
      toast.error(t('budgets.saveFailed'))
    }
    setIsSaving(false)
  }

  const displayAmount = item.amount ?? item.suggestedAmount ?? 0
  const percentSpent =
    displayAmount > 0 ? Math.min(100, (item.spent / displayAmount) * 100) : 0
  const isOverBudget = displayAmount > 0 && item.spent > displayAmount
  const barColor = isOverBudget
    ? 'bg-red-500'
    : percentSpent >= 80
      ? 'bg-yellow-500'
      : 'bg-primary'

  return (
    <div className="rounded-lg border p-3">
      <form
        className="mb-2 flex items-center justify-between gap-2"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.categoryName}</span>
          {isSuggested && (
            <Badge variant="secondary">{t('budgets.suggested')}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <CurrencyInput
            name={`budget-${item.categoryId}`}
            defaultValue={
              item.amount !== null
                ? String(item.amount)
                : item.suggestedAmount !== null
                  ? String(item.suggestedAmount)
                  : undefined
            }
            placeholder="0"
          />
          <Button type="submit" size="sm" variant="outline" disabled={isSaving}>
            {isSaving ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              t('budgets.save')
            )}
          </Button>
        </div>
      </form>

      {displayAmount > 0 && (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${percentSpent}%` }}
            />
          </div>
          <p
            className={`mt-1 text-xs ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}
          >
            {t('budgets.spentOfBudget', {
              spent: formatMoney(item.spent, currency),
              budget: formatMoney(displayAmount, currency),
            })}
          </p>
        </>
      )}
    </div>
  )
}

export function Budgets() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { refreshKey, triggerRefresh } = useDashboardRefresh()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [items, setItems] = useState<CategoryBudget[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await getBudgetOverview(month, year)
      setItems(data)
    } catch (error) {
      console.error('Error loading budgets:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, refreshKey])

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const totalBudgeted = items.reduce(
    (sum, item) => sum + (item.amount ?? item.suggestedAmount ?? 0),
    0
  )
  const totalSpent = items.reduce((sum, item) => sum + item.spent, 0)

  return (
    <div className="flex w-full flex-col gap-4 rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
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

      {!loading && items.length > 0 && totalBudgeted > 0 && (
        <p className="text-muted-foreground text-sm">
          {t('budgets.totalSpentOfBudget', {
            spent: formatMoney(totalSpent, currency),
            budget: formatMoney(totalBudgeted, currency),
          })}
        </p>
      )}

      {loading ? (
        <Loader className="m-auto h-8 w-8 animate-spin" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PiggyBank className="mb-4 h-16 w-16 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {t('budgets.noCategoriesYet')}
          </h3>
          <p className="max-w-sm text-gray-500">
            {t('budgets.noCategoriesYetDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <BudgetRow
              key={item.categoryId}
              item={item}
              month={month}
              year={year}
              currency={currency}
              onSaved={() => {
                triggerRefresh()
                load()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
