'use client'

import {
  deleteTransaction,
  deleteTransfer,
} from '@/app/dashboard/transactions/actions'
import { useLanguage } from '@/components/language-provider'
import { Pencil, Trash2 } from 'lucide-react'
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
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { type EditableItem } from './edit-transaction-dialog'
import { useDashboardRefresh } from './refresh-provider'

export function TransactionRowActions({
  item,
  onEdit,
}: {
  item: EditableItem
  onEdit: (item: EditableItem) => void
}) {
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (item.itemType === 'transfer') {
        await deleteTransfer(item.id)
      } else {
        await deleteTransaction(item.id)
      }
      triggerRefresh()
      toast.success(t('transactions.deleteSuccess'))
      setIsDeleteOpen(false)
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error(t('transactions.deleteFailed'))
    }
    setIsDeleting(false)
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={t('transactions.edit')}
        onClick={() => onEdit(item)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive h-8 w-8"
        aria-label={t('transactions.delete')}
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('transactions.deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('transactions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {t('transactions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
