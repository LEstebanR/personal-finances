'use client'

import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useCategoryMonthlyTotals } from '@/lib/queries'
import { ChevronLeft, ChevronRight, Loader, Table } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../ui/button'

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

const EMPTY_ARRAY: never[] = []

export function SpendingTrends() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const [year, setYear] = useState(new Date().getFullYear())
  const { data: rows = EMPTY_ARRAY, isLoading: loading } =
    useCategoryMonthlyTotals(year)

  const monthTotals = MONTH_KEYS.map((_, month) =>
    rows.reduce((sum, row) => sum + row.monthlyTotals[month], 0)
  )
  const grandTotal = monthTotals.reduce((sum, amount) => sum + amount, 0)

  return (
    <div className="flex w-full flex-col gap-6 rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">{t('spendingTrends.title')}</h1>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center font-medium">{year}</span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader className="m-auto h-8 w-8 animate-spin" />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Table className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-muted-foreground text-sm">
            {t('spendingTrends.noData')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="bg-background sticky left-0 p-2 text-left font-medium">
                  {t('transactions.category')}
                </th>
                {MONTH_KEYS.map((key) => (
                  <th key={key} className="p-2 text-right font-medium">
                    {t(`budgets.months.${key}`).slice(0, 3)}
                  </th>
                ))}
                <th className="p-2 text-right font-medium">
                  {t('spendingTrends.total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowTotal = row.monthlyTotals.reduce((a, b) => a + b, 0)
                return (
                  <tr key={row.categoryId} className="border-b">
                    <td className="bg-background sticky left-0 p-2 font-medium">
                      {row.categoryName}
                    </td>
                    {row.monthlyTotals.map((amount, i) => (
                      <td
                        key={i}
                        className="text-muted-foreground p-2 text-right"
                      >
                        {amount > 0 ? `$${formatMoney(amount, currency)}` : '—'}
                      </td>
                    ))}
                    <td className="p-2 text-right font-semibold">
                      ${formatMoney(rowTotal, currency)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td className="bg-background sticky left-0 p-2 font-semibold">
                  {t('spendingTrends.total')}
                </td>
                {monthTotals.map((amount, i) => (
                  <td key={i} className="p-2 text-right font-semibold">
                    ${formatMoney(amount, currency)}
                  </td>
                ))}
                <td className="p-2 text-right font-bold">
                  ${formatMoney(grandTotal, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
