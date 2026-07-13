'use client'

import { getAccounts } from '@/app/dashboard/accounts/actions'
import { createDebtPayment } from '@/app/dashboard/debts/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney, parseCurrencyInput } from '@/lib/currency'
import { Loader } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/currency-input'
import { DatePicker } from '../ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
  isArchived: boolean
}

interface Debt {
  id: string
  name: string
  remainingBalance: number
}

export function AddDebtPaymentDialog({
  debt,
  trigger,
}: {
  debt: Debt
  trigger: React.ReactNode
}) {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('debtId', debt.id)
    const amount = parseCurrencyInput(formData.get('amount'))

    setIsSubmitting(true)

    try {
      await createDebtPayment(formData)
      toast.success(t('debts.paymentRecorded'), {
        description: `-$${formatMoney(amount, currency)} • ${debt.name}`,
      })
      triggerRefresh()
      e.currentTarget?.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Error recording debt payment:', error)
      toast.error(t('debts.saveFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) loadAvailableAccounts()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('debts.recordPayment')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('debts.recordPaymentDesc', { name: debt.name })}
        </DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.fromAccount')}</Label>
            <Select name="accountId" required>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingAccounts
                      ? t('transactions.loadingAccounts')
                      : t('transactions.selectAnAccount')
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
            <Label>{t('debts.paymentAmount')}</Label>
            <CurrencyInput
              name="amount"
              required
              defaultValue={String(debt.remainingBalance)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.date')}</Label>
            <DatePicker name="date" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.note')}</Label>
            <Textarea name="note" className="resize-none" />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('debts.recordingPayment')}
              </>
            ) : (
              t('debts.recordPayment')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
