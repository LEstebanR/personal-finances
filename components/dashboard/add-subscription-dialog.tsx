'use client'

import {
  createSubscription,
  updateSubscription,
} from '@/app/dashboard/subscriptions/actions'
import { useLanguage } from '@/components/language-provider'
import { isPlanLimitError } from '@/lib/plan-limits-shared'
import { useAccounts, useDebts } from '@/lib/queries'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader, PlusIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '../ui/button'
import { CategoryCombobox } from '../ui/category-combobox'
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
import { SubcategoryCombobox } from '../ui/subcategory-combobox'
import { TextField } from '../ui/text-field'
import { useDashboardRefresh } from './refresh-provider'

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

export interface EditableSubscription {
  id: string
  name: string
  categoryId: string
  subcategoryId: string | null
  amount: number
  frequency: string
  dueDay: number | null
  dueMonth: number | null
  startDate: Date
  accountId: string | null
  debtId: string | null
}

export function AddSubscriptionDialog({
  trigger,
  subscription,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  trigger?: React.ReactNode
  subscription?: EditableSubscription | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = setControlledOpen ?? setInternalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categoryId, setCategoryId] = useState(subscription?.categoryId ?? '')
  const { data: rawAccounts = [], isLoading: loadingAccounts } = useAccounts()
  const { data: rawDebts = [] } = useDebts()
  const availableAccounts = rawAccounts.filter(
    (account) => !account.isArchived && !account.lockedByPlan
  )
  const availableDebts = rawDebts.filter(
    (debt) => debt.type === 'credit_card' && !debt.lockedByPlan
  )
  const [sourceType, setSourceType] = useState<'account' | 'debt'>(
    subscription?.debtId ? 'debt' : 'account'
  )
  const [sourceId, setSourceId] = useState(
    subscription?.accountId ?? subscription?.debtId ?? ''
  )
  const isEditing = !!subscription
  const formRef = useRef<HTMLFormElement>(null)

  const schema = z.object({
    name: z.string().trim().min(1, t('subscriptions.nameRequired')),
    amount: z.string().min(1, t('subscriptions.amountRequired')),
    frequency: z.string(),
    dueDay: z.string().min(1, t('subscriptions.dueDayRequired')),
    sourceKey: z.string().optional(),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: subscription?.name ?? '',
      amount: subscription ? String(subscription.amount) : '',
      frequency: subscription?.frequency === 'yearly' ? 'yearly' : 'monthly',
      dueDay: subscription?.dueDay != null ? String(subscription.dueDay) : '',
      sourceKey: subscription
        ? `${subscription.debtId ? 'debt' : 'account'}:${subscription.accountId ?? subscription.debtId ?? ''}`
        : '',
    },
  })
  const frequency = form.watch('frequency')

  // The dialog instance used for editing is shared across every subscription
  // (rendered once, controlled via the `subscription` prop), so its form and
  // local state need to be explicitly resynced whenever a different
  // subscription is opened for editing — they're only used as initial values
  // by react-hook-form/useState otherwise.
  useEffect(() => {
    form.reset({
      name: subscription?.name ?? '',
      amount: subscription ? String(subscription.amount) : '',
      frequency: subscription?.frequency === 'yearly' ? 'yearly' : 'monthly',
      dueDay: subscription?.dueDay != null ? String(subscription.dueDay) : '',
      sourceKey: subscription
        ? `${subscription.debtId ? 'debt' : 'account'}:${subscription.accountId ?? subscription.debtId ?? ''}`
        : '',
    })
    setCategoryId(subscription?.categoryId ?? '')
    setSourceType(subscription?.debtId ? 'debt' : 'account')
    setSourceId(subscription?.accountId ?? subscription?.debtId ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription])

  const onSubmit = form.handleSubmit(async () => {
    const formData = new FormData(formRef.current!)

    if (!formData.get('accountId') && !formData.get('debtId')) {
      toast.error(t('transactions.sourceRequired'))
      return
    }

    setIsSubmitting(true)

    try {
      if (subscription) {
        await updateSubscription(subscription.id, formData)
        toast.success(t('subscriptions.updateSuccess'))
      } else {
        await createSubscription(formData)
        toast.success(t('subscriptions.subscriptionCreated'))
      }
      triggerRefresh()
      setIsOpen(false)
    } catch (error) {
      console.error('Error saving subscription:', error)
      toast.error(
        isPlanLimitError(error)
          ? t('subscriptions.subscriptionLimitReached')
          : t('debts.saveFailed')
      )
    }

    setIsSubmitting(false)
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('subscriptions.editSubscription')
              : t('subscriptions.addSubscription')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t('subscriptions.dialogDescription')}
        </DialogDescription>
        <Form {...form}>
          <form
            ref={formRef}
            className="flex flex-col gap-4"
            onSubmit={onSubmit}
            noValidate
          >
            <TextField name="name" label={t('debts.name')} type="text" />
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.category')}</Label>
              <CategoryCombobox
                key={`category-${subscription?.id ?? 'new'}`}
                name="categoryId"
                type="expense"
                defaultValue={subscription?.categoryId}
                onChange={setCategoryId}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.subcategory')}</Label>
              <SubcategoryCombobox
                key={`subcategory-${subscription?.id ?? 'new'}`}
                name="subcategoryId"
                categoryId={categoryId}
                defaultValue={subscription?.subcategoryId ?? undefined}
              />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <CurrencyField
                key={`amount-${subscription?.id ?? 'new'}`}
                name="amount"
                label={t('transactions.amount')}
                defaultValue={
                  subscription ? String(subscription.amount) : undefined
                }
              />
              <SelectField
                name="frequency"
                label={t('subscriptions.frequency')}
              >
                <SelectItem value="monthly">
                  {t('subscriptions.monthly')}
                </SelectItem>
                <SelectItem value="yearly">
                  {t('subscriptions.yearly')}
                </SelectItem>
              </SelectField>
            </div>
            {frequency === 'yearly' && (
              <SelectField name="dueMonth" label={t('subscriptions.dueMonth')}>
                {MONTH_KEYS.map((key, index) => (
                  <SelectItem key={key} value={String(index + 1)}>
                    {t(`budgets.months.${key}`)}
                  </SelectItem>
                ))}
              </SelectField>
            )}
            <TextField
              name="dueDay"
              label={t('subscriptions.dueDay')}
              type="number"
              min={1}
              max={31}
              placeholder={t('debts.dayOfMonth')}
            />
            {subscription ? (
              <p className="text-muted-foreground text-xs">
                {t('subscriptions.startedOn', {
                  date: subscription.startDate.toLocaleDateString(undefined, {
                    timeZone: 'UTC',
                  }),
                })}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <Label>{t('subscriptions.startDate')}</Label>
                <DatePicker name="startDate" />
              </div>
            )}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing
                    ? t('transactions.savingChanges')
                    : t('budgets.creatingItem')}
                </>
              ) : isEditing ? (
                t('debts.saveChanges')
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  {t('subscriptions.addSubscription')}
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
