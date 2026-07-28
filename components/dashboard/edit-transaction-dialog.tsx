'use client'

import {
  updateTransaction,
  updateTransfer,
} from '@/app/dashboard/transactions/actions'
import { useLanguage } from '@/components/language-provider'
import { useAccounts, useDebts } from '@/lib/queries'
import { toLocalMidnight } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '../ui/button'
import { CategoryCombobox } from '../ui/category-combobox'
import { CurrencyField } from '../ui/currency-field'
import { DatePicker } from '../ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Form } from '../ui/form'
import { Label } from '../ui/label'
import { SelectGroup, SelectItem, SelectLabel } from '../ui/select'
import { SelectField } from '../ui/select-field'
import { SubcategoryCombobox } from '../ui/subcategory-combobox'
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

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
  const { data: rawAccounts = [] } = useAccounts()
  const { data: rawDebts = [] } = useDebts()
  const availableAccounts = rawAccounts.filter((a) => !a.isArchived)
  const availableDebts = rawDebts.filter((d) => d.type === 'credit_card')
  const [categoryId, setCategoryId] = useState('')
  const [sourceType, setSourceType] = useState<'account' | 'debt'>('account')
  const [sourceId, setSourceId] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const schema = z
    .object({
      amount: z.string().min(1, t('transactions.amountRequired')),
      fromAccountId: z.string().optional(),
      toAccountId: z.string().optional(),
      sourceKey: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (item?.itemType === 'transfer') {
        if (!data.fromAccountId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('transactions.fromAccountRequired'),
            path: ['fromAccountId'],
          })
        }
        if (!data.toAccountId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('transactions.toAccountRequired'),
            path: ['toAccountId'],
          })
        }
      }
    })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', fromAccountId: '', toAccountId: '' },
  })

  useEffect(() => {
    setCategoryId(item?.itemType === 'transaction' ? item.categoryId : '')

    const initialSourceType: 'account' | 'debt' =
      item?.itemType === 'transaction' && item.debtId ? 'debt' : 'account'
    const initialSourceId =
      item?.itemType === 'transaction'
        ? (item.debtId ?? item.accountId ?? '')
        : ''
    setSourceType(initialSourceType)
    setSourceId(initialSourceId)

    form.reset({
      amount: item ? String(item.amount) : '',
      fromAccountId: item?.itemType === 'transfer' ? item.fromAccountId : '',
      toAccountId: item?.itemType === 'transfer' ? item.toAccountId : '',
      sourceKey:
        item?.itemType === 'transaction'
          ? `${initialSourceType}:${initialSourceId}`
          : '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  const onSubmit = form.handleSubmit(async () => {
    if (!item) return
    const formData = new FormData(formRef.current!)

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
  })

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
        <Form {...form}>
          <form
            ref={formRef}
            className="flex flex-col gap-4"
            onSubmit={onSubmit}
            noValidate
          >
            {item.itemType === 'transfer' ? (
              <>
                <SelectField
                  name="fromAccountId"
                  label={t('transactions.fromAccount')}
                >
                  {availableAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectField>
                <SelectField
                  name="toAccountId"
                  label={t('transactions.toAccount')}
                >
                  {availableAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectField>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.account')}</Label>
                <SelectField
                  name="sourceKey"
                  onValueChange={(value) => {
                    const [type, id] = value.split(':')
                    setSourceType(type as 'account' | 'debt')
                    setSourceId(id)
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
            )}
            <CurrencyField name="amount" label={t('transactions.amount')} />
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.date')}</Label>
              <DatePicker
                name="date"
                defaultValue={toLocalMidnight(item.date)}
              />
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
        </Form>
      </DialogContent>
    </Dialog>
  )
}
