'use client'

import { deleteDebt, updateDebt } from '@/app/dashboard/debts/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/currency-input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useDashboardRefresh } from './refresh-provider'

interface Debt {
  id: string
  name: string
  type: string
  minimumPayment: number | null
  paymentDueDay: number | null
  creditLimit: number | null
}

export function EditDebtDialog({
  debt,
  open,
  onOpenChange,
}: {
  debt: Debt | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!debt) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      await updateDebt(debt.id, formData)
      toast.success(t('debts.updateSuccess'))
      triggerRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating debt:', error)
      toast.error(t('debts.updateFailed'))
    }

    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!debt) return
    try {
      await deleteDebt(debt.id)
      toast.success(t('debts.deleteSuccess'))
      triggerRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting debt:', error)
      toast.error(t('debts.deleteFailed'))
    }
  }

  if (!debt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('debts.editDebt')}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('debts.name')}</Label>
            <Input type="text" name="name" required defaultValue={debt.name} />
          </div>
          {debt.type === 'credit_card' && (
            <div className="flex flex-col gap-1">
              <Label>{t('debts.creditLimit')}</Label>
              <CurrencyInput
                name="creditLimit"
                defaultValue={
                  typeof debt.creditLimit === 'number'
                    ? String(debt.creditLimit)
                    : undefined
                }
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>{t('debts.minimumPayment')}</Label>
              <CurrencyInput
                name="minimumPayment"
                defaultValue={
                  typeof debt.minimumPayment === 'number'
                    ? String(debt.minimumPayment)
                    : undefined
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('debts.paymentDueDay')}</Label>
              <Input
                type="number"
                name="paymentDueDay"
                min={1}
                max={31}
                placeholder={t('debts.dayOfMonth')}
                defaultValue={debt.paymentDueDay ?? undefined}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="flex-1">
                  <Trash2 className="h-4 w-4" />
                  {t('debts.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('debts.deleteConfirmTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('debts.deleteConfirmDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('debts.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {t('debts.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                t('debts.saveChanges')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
