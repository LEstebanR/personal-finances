'use client'

import {
  createSubscription,
  updateSubscription,
} from '@/app/dashboard/subscriptions/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { CategoryCombobox } from '../ui/category-combobox'
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
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { SubcategoryCombobox } from '../ui/subcategory-combobox'
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
  const [frequency, setFrequency] = useState(
    subscription?.frequency === 'yearly' ? 'yearly' : 'monthly'
  )
  const isEditing = !!subscription

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      if (subscription) {
        await updateSubscription(subscription.id, formData)
        toast.success(t('subscriptions.updateSuccess'))
      } else {
        await createSubscription(formData)
        toast.success(t('subscriptions.subscriptionCreated'))
      }
      triggerRefresh()
      e.currentTarget?.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Error saving subscription:', error)
      toast.error(t('debts.saveFailed'))
    }

    setIsSubmitting(false)
  }

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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.name')}</Label>
            <Input
              type="text"
              name="name"
              required
              defaultValue={subscription?.name}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.category')}</Label>
            <CategoryCombobox
              name="categoryId"
              type="expense"
              defaultValue={subscription?.categoryId}
              onChange={setCategoryId}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.subcategory')}</Label>
            <SubcategoryCombobox
              name="subcategoryId"
              categoryId={categoryId}
              defaultValue={subscription?.subcategoryId ?? undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.amount')}</Label>
              <CurrencyInput
                name="amount"
                required
                defaultValue={
                  subscription ? String(subscription.amount) : undefined
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('subscriptions.frequency')}</Label>
              <Select
                name="frequency"
                defaultValue={frequency}
                onValueChange={setFrequency}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    {t('subscriptions.monthly')}
                  </SelectItem>
                  <SelectItem value="yearly">
                    {t('subscriptions.yearly')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {frequency === 'yearly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label>{t('subscriptions.dueMonth')}</Label>
                <Select
                  name="dueMonth"
                  defaultValue={
                    subscription?.dueMonth != null
                      ? String(subscription.dueMonth)
                      : undefined
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_KEYS.map((key, index) => (
                      <SelectItem key={key} value={String(index + 1)}>
                        {t(`budgets.months.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t('subscriptions.dueDay')}</Label>
                <Input
                  type="number"
                  name="dueDay"
                  min={1}
                  max={31}
                  required
                  placeholder={t('debts.dayOfMonth')}
                  defaultValue={subscription?.dueDay ?? undefined}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Label>{t('subscriptions.dueDay')}</Label>
              <Input
                type="number"
                name="dueDay"
                min={1}
                max={31}
                required
                placeholder={t('debts.dayOfMonth')}
                defaultValue={subscription?.dueDay ?? undefined}
              />
            </div>
          )}
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
      </DialogContent>
    </Dialog>
  )
}
