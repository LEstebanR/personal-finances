'use client'

import { createDebtInterestCharge } from '@/app/dashboard/debts/actions'
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
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

interface Debt {
  id: string
  name: string
}

export function AddDebtInterestDialog({
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('debtId', debt.id)
    const amount = parseCurrencyInput(formData.get('amount'))

    setIsSubmitting(true)

    try {
      await createDebtInterestCharge(formData)
      toast.success(t('debts.interestRecorded'), {
        description: `+$${formatMoney(amount, currency)} • ${debt.name}`,
      })
      triggerRefresh()
      e.currentTarget?.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Error recording debt interest:', error)
      toast.error(t('debts.saveFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('debts.addInterest')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('debts.addInterestDesc', { name: debt.name })}
        </DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.interestAmount')}</Label>
            <CurrencyInput name="amount" required />
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
                {t('debts.recordingInterest')}
              </>
            ) : (
              t('debts.addInterest')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
