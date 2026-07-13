'use client'

import { createDebt } from '@/app/dashboard/debts/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/currency-input'
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
import { useDashboardRefresh } from './refresh-provider'

export function AddDebtDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = setControlledOpen ?? setInternalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debtType, setDebtType] = useState('loan')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await createDebt(formData)
      toast.success(t('debts.debtCreated'))
      triggerRefresh()
      e.currentTarget?.reset()
      setDebtType('loan')
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating debt:', error)
      toast.error(t('debts.saveFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('debts.addDebt')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('debts.dialogDescription')}</DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.name')}</Label>
            <Input type="text" name="name" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.type')}</Label>
            <Select name="type" defaultValue="loan" onValueChange={setDebtType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loan">{t('debts.loan')}</SelectItem>
                <SelectItem value="credit_card">
                  {t('debts.creditCard')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.originalAmount')}</Label>
            <CurrencyInput name="originalAmount" required />
          </div>
          {debtType === 'credit_card' && (
            <div className="flex flex-col gap-1">
              <Label>{t('debts.creditLimit')}</Label>
              <CurrencyInput name="creditLimit" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>{t('debts.minimumPayment')}</Label>
              <CurrencyInput name="minimumPayment" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('debts.paymentDueDay')}</Label>
              <Input
                type="number"
                name="paymentDueDay"
                min={1}
                max={31}
                placeholder={t('debts.dayOfMonth')}
              />
            </div>
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('debts.creatingDebt')}
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4" />
                {t('debts.addDebt')}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
