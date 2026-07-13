'use client'

import { getAccounts } from '@/app/dashboard/accounts/actions'
import { getDebts } from '@/app/dashboard/debts/actions'
import {
  updateTransaction,
  updateTransfer,
} from '@/app/dashboard/transactions/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { CategoryCombobox } from '../ui/category-combobox'
import { CurrencyInput } from '../ui/currency-input'
import { DatePicker } from '../ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { SubcategoryCombobox } from '../ui/subcategory-combobox'
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
  isArchived: boolean
}

interface CreditCardDebt {
  id: string
  name: string
  type: string
}

export interface EditableTransaction {
  itemType: 'transaction'
  id: string
  accountId: string | null
  debtId: string | null
  amount: number
  type: string
  description: string
  date: Date
  categoryId: string
  subcategoryId: string | null
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
  const [availableDebts, setAvailableDebts] = useState<CreditCardDebt[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [sourceType, setSourceType] = useState<'account' | 'debt'>('account')
  const [sourceId, setSourceId] = useState('')

  useEffect(() => {
    if (!open) return
    Promise.all([getAccounts(), getDebts()])
      .then(([accounts, debts]) => {
        setAvailableAccounts(accounts.filter((a) => !a.isArchived))
        setAvailableDebts(debts.filter((d) => d.type === 'credit_card'))
      })
      .catch((error) => console.error('Error loading accounts:', error))
  }, [open])

  useEffect(() => {
    setCategoryId(item?.itemType === 'transaction' ? item.categoryId : '')
    if (item?.itemType === 'transaction') {
      if (item.debtId) {
        setSourceType('debt')
        setSourceId(item.debtId)
      } else {
        setSourceType('account')
        setSourceId(item.accountId ?? '')
      }
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!item) return
    const formData = new FormData(e.currentTarget)

    if (item.itemType === 'transaction' && !formData.get('categoryId')) {
      toast.error(t('transactions.categoryRequired'))
      return
    }
    if (
      item.itemType === 'transaction' &&
      !formData.get('accountId') &&
      !formData.get('debtId')
    ) {
      toast.error(t('transactions.sourceRequired'))
      return
    }

    setIsSubmitting(true)

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
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
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
              <Select
                value={sourceId ? `${sourceType}:${sourceId}` : undefined}
                onValueChange={(value) => {
                  const [type, id] = value.split(':')
                  setSourceType(type as 'account' | 'debt')
                  setSourceId(id)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                  {item.type === 'expense' && availableDebts.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t('transactions.creditCards')}</SelectLabel>
                      {availableDebts.map((debt) => (
                        <SelectItem key={debt.id} value={`debt:${debt.id}`}>
                          {debt.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
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
            <>
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.category')}</Label>
                <CategoryCombobox
                  name="categoryId"
                  type={item.type as 'income' | 'expense'}
                  defaultValue={item.categoryId}
                  onChange={setCategoryId}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.subcategory')}</Label>
                <SubcategoryCombobox
                  name="subcategoryId"
                  categoryId={categoryId}
                  defaultValue={item.subcategoryId ?? undefined}
                />
              </div>
            </>
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
