'use client'

import {
  cancelRecurringExpense,
  convertBudgetItemToRecurring,
  createBudgetItem,
  createRecurringExpense,
  updateBudgetItem,
} from '@/app/dashboard/budgets/actions'
import { useLanguage } from '@/components/language-provider'
import { toLocalMidnight } from '@/lib/utils'
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
import { Switch } from '../ui/switch'

export interface EditableBudgetItem {
  id: string
  categoryId: string
  subcategoryId: string | null
  date: Date
  amount: number
  description: string
  subscriptionId: string | null
  recurringExpenseId: string | null
  debtId: string | null
}

export function AddBudgetItemDialog({
  trigger,
  defaultDate,
  item,
  onSaved,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  trigger?: React.ReactNode
  defaultDate?: Date
  item?: EditableBudgetItem | null
  onSaved: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = setControlledOpen ?? setInternalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '')
  const [isRecurring, setIsRecurring] = useState(false)
  const isEditing = !!item
  const canConvertToRecurring =
    isEditing &&
    !item.subscriptionId &&
    !item.recurringExpenseId &&
    !item.debtId

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      if (item) {
        if (isRecurring) {
          await convertBudgetItemToRecurring(item.id, formData)
          toast.success(t('budgets.convertedToRecurring'))
        } else {
          await updateBudgetItem(item.id, formData)
          toast.success(t('budgets.itemUpdated'))
        }
      } else if (isRecurring) {
        await createRecurringExpense(formData)
        toast.success(t('budgets.recurringExpenseCreated'))
      } else {
        await createBudgetItem(formData)
        toast.success(t('budgets.itemCreated'))
      }
      onSaved()
      e.currentTarget?.reset()
      setIsOpen(false)
      setIsRecurring(false)
    } catch (error) {
      console.error('Error saving budget item:', error)
      toast.error(t('budgets.itemSaveFailed'))
    }

    setIsSubmitting(false)
  }

  const handleCancelRecurring = async () => {
    if (!item?.recurringExpenseId) return
    setIsCancelling(true)
    try {
      await cancelRecurringExpense(item.recurringExpenseId)
      toast.success(t('budgets.recurringCancelled'))
      onSaved()
      setIsOpen(false)
    } catch (error) {
      console.error('Error cancelling recurring expense:', error)
      toast.error(t('budgets.recurringCancelFailed'))
    }
    setIsCancelling(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('budgets.editItem') : t('budgets.addItem')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('budgets.addItemDesc')}</DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.date')}</Label>
            <DatePicker
              name="date"
              defaultValue={item ? toLocalMidnight(item.date) : defaultDate}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.category')}</Label>
            <CategoryCombobox
              name="categoryId"
              type="expense"
              defaultValue={item?.categoryId}
              onChange={setCategoryId}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.subcategory')}</Label>
            <SubcategoryCombobox
              name="subcategoryId"
              categoryId={categoryId}
              defaultValue={item?.subcategoryId ?? undefined}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.paymentAmount')}</Label>
            <CurrencyInput
              name="amount"
              required
              defaultValue={item ? String(item.amount) : undefined}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>
              {isRecurring ? t('debts.name') : t('budgets.descriptionOptional')}
            </Label>
            <Input
              type="text"
              name="description"
              required={isRecurring}
              defaultValue={item?.description}
            />
          </div>
          {(!isEditing || canConvertToRecurring) && (
            <div className="flex flex-col gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="isRecurring" className="font-normal">
                  {isEditing
                    ? t('budgets.convertToRecurring')
                    : t('budgets.isRecurring')}
                </Label>
                <Switch
                  id="isRecurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>
              {isRecurring && (
                <>
                  <div className="flex flex-col gap-1">
                    <Label>{t('subscriptions.frequency')}</Label>
                    <Select name="frequency" defaultValue="monthly">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          {t('subscriptions.monthly')}
                        </SelectItem>
                        <SelectItem value="weekly">
                          {t('subscriptions.weekly')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {t('budgets.recurringNote')}
                  </p>
                </>
              )}
            </div>
          )}
          {isEditing && item.recurringExpenseId && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <p className="text-muted-foreground text-xs">
                {t('budgets.thisItemIsRecurring')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCancelling}
                onClick={handleCancelRecurring}
              >
                {isCancelling ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  t('budgets.cancelRecurring')
                )}
              </Button>
            </div>
          )}
          {isEditing && item.debtId && (
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">
                {t('budgets.thisItemIsFromDebt', { name: item.description })}
              </p>
            </div>
          )}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {isEditing
                  ? t('budgets.savingChanges')
                  : t('budgets.creatingItem')}
              </>
            ) : isEditing ? (
              t('budgets.saveChanges')
            ) : (
              <>
                <PlusIcon className="h-4 w-4" />
                {t('budgets.addItem')}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
