'use client'

import { createDebtPayment } from '@/app/dashboard/debts/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney, parseCurrencyInput } from '@/lib/currency'
import { useAccounts } from '@/lib/queries'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '../ui/button'
import { CurrencyField } from '../ui/currency-field'
import { DatePicker } from '../ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Form } from '../ui/form'
import { Label } from '../ui/label'
import { SelectItem } from '../ui/select'
import { SelectField } from '../ui/select-field'
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

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
  const { data: rawAccounts = [], isLoading: loadingAccounts } = useAccounts()
  const availableAccounts = rawAccounts.filter(
    (account) => !account.isArchived && !account.lockedByPlan
  )
  const formRef = useRef<HTMLFormElement>(null)

  const schema = z.object({
    accountId: z.string().min(1, t('debts.fromAccountRequired')),
    amount: z.string().min(1, t('debts.amountRequired')),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: '',
      amount: String(debt.remainingBalance),
    },
  })

  const onSubmit = form.handleSubmit(async () => {
    const formData = new FormData(formRef.current!)
    formData.set('debtId', debt.id)
    const amount = parseCurrencyInput(formData.get('amount'))

    setIsSubmitting(true)

    try {
      await createDebtPayment(formData)
      toast.success(t('debts.paymentRecorded'), {
        description: `-$${formatMoney(amount, currency)} • ${debt.name}`,
      })
      triggerRefresh()
      form.reset({ accountId: '', amount: String(debt.remainingBalance) })
      setIsOpen(false)
    } catch (error) {
      console.error('Error recording debt payment:', error)
      toast.error(t('debts.saveFailed'))
    }

    setIsSubmitting(false)
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('debts.recordPayment')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('debts.recordPaymentDesc', { name: debt.name })}
        </DialogDescription>
        <Form {...form}>
          <form
            ref={formRef}
            className="flex flex-col gap-4"
            onSubmit={onSubmit}
            noValidate
          >
            <SelectField
              name="accountId"
              label={t('debts.fromAccount')}
              placeholder={
                loadingAccounts
                  ? t('transactions.loadingAccounts')
                  : t('transactions.selectAnAccount')
              }
            >
              {availableAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectField>
            <CurrencyField name="amount" label={t('debts.paymentAmount')} />
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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
