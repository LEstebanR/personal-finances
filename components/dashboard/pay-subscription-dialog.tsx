'use client'

import { paySubscription } from '@/app/dashboard/subscriptions/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney, parseCurrencyInput } from '@/lib/currency'
import { useAccounts, useDebts } from '@/lib/queries'
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
import { SelectGroup, SelectItem, SelectLabel } from '../ui/select'
import { SelectField } from '../ui/select-field'
import { useDashboardRefresh } from './refresh-provider'

interface Subscription {
  id: string
  name: string
  amount: number
  accountId: string | null
  debtId: string | null
}

export function PaySubscriptionDialog({
  subscription,
  trigger,
}: {
  subscription: Subscription
  trigger: React.ReactNode
}) {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: rawAccounts = [], isLoading: loadingAccounts } = useAccounts()
  const { data: rawDebts = [] } = useDebts()
  const availableAccounts = rawAccounts.filter(
    (account) => !account.isArchived && !account.lockedByPlan
  )
  const availableDebts = rawDebts.filter(
    (debt) => debt.type === 'credit_card' && !debt.lockedByPlan
  )
  const [sourceType, setSourceType] = useState<'account' | 'debt'>(
    subscription.debtId ? 'debt' : 'account'
  )
  const [sourceId, setSourceId] = useState(
    subscription.accountId ?? subscription.debtId ?? ''
  )
  const formRef = useRef<HTMLFormElement>(null)

  const schema = z.object({
    amount: z.string().min(1, t('transactions.amountRequired')),
    sourceKey: z.string().optional(),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: String(subscription.amount),
      sourceKey: `${sourceType}:${sourceId}`,
    },
  })

  const onSubmit = form.handleSubmit(async () => {
    const formData = new FormData(formRef.current!)

    if (!formData.get('accountId') && !formData.get('debtId')) {
      toast.error(t('transactions.sourceRequired'))
      return
    }

    setIsSubmitting(true)
    const amount = parseCurrencyInput(formData.get('amount'))

    try {
      await paySubscription(subscription.id, formData)
      toast.success(t('subscriptions.paymentRecorded'), {
        description: `-$${formatMoney(amount, currency)} • ${subscription.name}`,
      })
      triggerRefresh()
      setIsOpen(false)
    } catch (error) {
      console.error('Error paying subscription:', error)
      toast.error(t('subscriptions.paymentFailed'))
    }

    setIsSubmitting(false)
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('subscriptions.payDialogTitle')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('subscriptions.payDialogDescription', { name: subscription.name })}
        </DialogDescription>
        <Form {...form}>
          <form
            ref={formRef}
            className="flex flex-col gap-4"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="flex flex-col gap-1">
              <Label>{t('subscriptions.paymentSource')}</Label>
              <SelectField
                name="sourceKey"
                placeholder={
                  loadingAccounts
                    ? t('transactions.loadingAccounts')
                    : t('transactions.selectAnAccount')
                }
                onValueChange={(value) => {
                  const [type, sourceKeyId] = value.split(':')
                  setSourceType(type as 'account' | 'debt')
                  setSourceId(sourceKeyId)
                }}
              >
                <SelectGroup>
                  <SelectLabel>{t('transactions.accounts')}</SelectLabel>
                  {availableAccounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={`account:${account.id}`}
                    >
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectGroup>
                {availableDebts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t('transactions.creditCards')}</SelectLabel>
                    {availableDebts.map((debt) => (
                      <SelectItem key={debt.id} value={`debt:${debt.id}`}>
                        {debt.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectField>
              <input
                type="hidden"
                name="accountId"
                value={sourceType === 'account' ? sourceId : ''}
              />
              <input
                type="hidden"
                name="debtId"
                value={sourceType === 'debt' ? sourceId : ''}
              />
            </div>
            <CurrencyField
              name="amount"
              label={t('transactions.amount')}
              defaultValue={String(subscription.amount)}
            />
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.date')}</Label>
              <DatePicker name="date" />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {t('subscriptions.recordingPayment')}
                </>
              ) : (
                t('subscriptions.payDialogTitle')
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
