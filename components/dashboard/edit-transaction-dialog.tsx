'use client'

import { getAccounts } from '@/app/dashboard/accounts/actions'
import {
  updateTransaction,
  updateTransfer,
} from '@/app/dashboard/transactions/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/currency-input'
import { DatePicker } from '../ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
  isArchived: boolean
}

export interface EditableTransaction {
  itemType: 'transaction'
  id: string
  accountId: string
  amount: number
  type: string
  description: string
  date: Date
  category: string | null
}

export interface EditableTransfer {
  itemType: 'transfer'
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  date: Date
  note: string | null
}

export type EditableItem = EditableTransaction | EditableTransfer

export function EditTransactionDialog({
  item,
  open,
  onOpenChange,
}: {
  item: EditableItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])

  useEffect(() => {
    if (!open) return
    getAccounts()
      .then((accounts) =>
        setAvailableAccounts(accounts.filter((a) => !a.isArchived))
      )
      .catch((error) => console.error('Error loading accounts:', error))
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!item) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      if (item.itemType === 'transfer') {
        formData.set('type', 'transfer')
        await updateTransfer(item.id, formData)
      } else {
        formData.set('type', item.type)
        await updateTransaction(item.id, formData)
      }

      triggerRefresh()
      toast.success(t('transactions.updateSuccess'))
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error(t('transactions.updateFailed'))
    }

    setIsSubmitting(false)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {item.itemType === 'transfer'
              ? t('transactions.editTransfer')
              : t('transactions.editTransaction')}
          </DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {item.itemType === 'transfer' ? (
            <>
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.fromAccount')}</Label>
                <Select
                  name="fromAccountId"
                  required
                  defaultValue={item.fromAccountId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.toAccount')}</Label>
                <Select
                  name="toAccountId"
                  required
                  defaultValue={item.toAccountId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.account')}</Label>
              <Select name="accountId" required defaultValue={item.accountId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.amount')}</Label>
            <CurrencyInput
              name="amount"
              required
              defaultValue={String(item.amount)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.date')}</Label>
            <DatePicker name="date" defaultValue={new Date(item.date)} />
          </div>
          {item.itemType === 'transaction' && (
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.category')}</Label>
              <Input
                type="text"
                name="category"
                defaultValue={item.category ?? ''}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.description')}</Label>
            <Textarea
              name="description"
              className="resize-none"
              required
              defaultValue={
                item.itemType === 'transfer'
                  ? (item.note ?? '')
                  : item.description
              }
            />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('transactions.savingChanges')}
              </>
            ) : (
              t('transactions.saveChanges')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
