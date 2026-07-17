'use client'

import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useDebts } from '@/lib/queries'
import { CreditCard, Loader, PlusIcon, Wallet } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { AddDebtDialog } from './add-debt-dialog'
import { AddDebtPaymentDialog } from './add-debt-payment-dialog'
import { EditDebtDialog } from './edit-debt-dialog'

interface Debt {
  id: string
  name: string
  type: string
  originalAmount: number
  remainingBalance: number
  minimumPayment: number | null
  paymentDueDay: number | null
  creditLimit: number | null
  createdAt: Date
}

export function Debts() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { data: debts = [], isLoading: loading } = useDebts()
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  const totalRemaining = debts.reduce(
    (total, debt) => total + debt.remainingBalance,
    0
  )

  const DebtCard = ({ debt }: { debt: Debt }) => {
    const paid = debt.originalAmount - debt.remainingBalance
    const percentPaid =
      debt.originalAmount > 0
        ? Math.min(100, Math.max(0, (paid / debt.originalAmount) * 100))
        : 0
    const isPaidOff = debt.remainingBalance <= 0

    return (
      <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="truncate text-xl font-bold text-gray-900">
              {debt.name}
            </h3>
            <div className="mt-1 h-5">
              {debt.type === 'credit_card' && (
                <Badge variant="secondary" className="gap-1">
                  <CreditCard className="h-3 w-3" />
                  {t('debts.creditCard')}
                </Badge>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingDebt(debt)}
          >
            {t('debts.edit')}
          </Button>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-sm text-gray-500">
            {t('debts.remainingBalance')}
          </p>
          <p
            className={`text-3xl font-bold ${isPaidOff ? 'text-green-600' : 'text-gray-900'}`}
          >
            ${formatMoney(debt.remainingBalance, currency)}
          </p>
        </div>

        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${isPaidOff ? 'bg-green-500' : 'bg-primary'}`}
              style={{ width: `${percentPaid}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {t('debts.paidOfTotal', {
              paid: formatMoney(paid, currency),
              total: formatMoney(debt.originalAmount, currency),
            })}
          </p>
        </div>

        {typeof debt.creditLimit === 'number' && (
          <p className="mb-2 text-xs text-gray-500">
            {t('debts.availableCredit')}: $
            {formatMoney(
              Math.max(0, debt.creditLimit - debt.remainingBalance),
              currency
            )}{' '}
            {t('debts.ofLimit', {
              limit: formatMoney(debt.creditLimit, currency),
            })}
          </p>
        )}

        {(typeof debt.minimumPayment === 'number' ||
          typeof debt.paymentDueDay === 'number') && (
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {typeof debt.minimumPayment === 'number' && (
              <span>
                {t('debts.minimumPayment')}: $
                {formatMoney(debt.minimumPayment, currency)}
              </span>
            )}
            {typeof debt.paymentDueDay === 'number' && (
              <span>
                {t('debts.dueOnDay', { day: String(debt.paymentDueDay) })}
              </span>
            )}
          </div>
        )}

        {!isPaidOff && (
          <div className="mt-auto pt-2">
            <AddDebtPaymentDialog
              debt={debt}
              trigger={
                <Button className="w-full" size="sm">
                  {t('debts.recordPayment')}
                </Button>
              }
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('debts.title')}</h1>
          {!loading && debts.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {t('debts.totalOwed')}: ${formatMoney(totalRemaining, currency)}
            </p>
          )}
        </div>
        <AddDebtDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              {t('debts.addDebt')}
            </Button>
          }
        />
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <Loader className="m-auto h-8 w-8 animate-spin" />
        ) : debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('debts.noDebtsYet')}
            </h3>
            <p className="mb-6 max-w-sm text-gray-500">
              {t('debts.noDebtsYetDesc')}
            </p>
            <AddDebtDialog
              trigger={
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  {t('debts.addDebt')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {[...debts]
              .sort((a, b) => b.remainingBalance - a.remainingBalance)
              .map((debt) => (
                <DebtCard key={debt.id} debt={debt} />
              ))}
          </div>
        )}
      </div>

      <EditDebtDialog
        debt={editingDebt}
        open={!!editingDebt}
        onOpenChange={(open) => !open && setEditingDebt(null)}
      />
    </div>
  )
}
