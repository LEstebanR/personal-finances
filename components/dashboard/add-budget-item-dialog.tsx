'use client'

import {
  createBudgetItem,
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
import { SubcategoryCombobox } from '../ui/subcategory-combobox'

export interface EditableBudgetItem {
  id: string
  categoryId: string
  subcategoryId: string | null
  date: Date
  amount: number
  description: string
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
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '')
  const isEditing = !!item

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      if (item) {
        await updateBudgetItem(item.id, formData)
        toast.success(t('budgets.itemUpdated'))
      } else {
        await createBudgetItem(formData)
        toast.success(t('budgets.itemCreated'))
      }
      onSaved()
      e.currentTarget?.reset()
      setIsOpen(false)
    } catch (error) {
      console.error('Error saving budget item:', error)
      toast.error(t('budgets.itemSaveFailed'))
    }

    setIsSubmitting(false)
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
            <Label>{t('budgets.descriptionOptional')}</Label>
            <Input
              type="text"
              name="description"
              defaultValue={item?.description}
            />
          </div>
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
