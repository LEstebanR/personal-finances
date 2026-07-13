'use client'

import { getAccounts } from '@/app/dashboard/accounts/actions'
import {
  createTransaction,
  createTransfer,
} from '@/app/dashboard/transactions/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney, parseCurrencyInput } from '@/lib/currency'
import { Loader } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
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
import { Textarea } from '../ui/textarea'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
  isArchived: boolean
}

export function AddTransactionDialog({
  trigger,
}: {
  trigger: React.ReactNode
}) {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [transactionType, setTransactionType] = useState('')

  const loadAvailableAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const accounts = await getAccounts()
      setAvailableAccounts(accounts.filter((account) => !account.isArchived))
    } catch (error) {
      console.error('Error loading available accounts:', error)
    }
    setLoadingAccounts(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const type = formData.get('type') as string

    try {
      if (type === 'transfer') {
        const fromAccountId = formData.get('fromAccountId') as string
        const toAccountId = formData.get('toAccountId') as string
        const amount = parseCurrencyInput(formData.get('amount'))

        await createTransfer(formData)

        const fromAccount = availableAccounts.find(
          (a) => a.id === fromAccountId
        )
        const toAccount = availableAccounts.find((a) => a.id === toAccountId)

        toast.success(t('transactions.transferCompleted'), {
          description: t('transactions.transferCompletedDesc', {
            amount: formatMoney(amount, currency),
            from: fromAccount?.name || t('transactions.account'),
            to: toAccount?.name || t('transactions.account'),
          }),
        })
      } else {
        const accountId = formData.get('accountId') as string
        const amount = parseCurrencyInput(formData.get('amount'))

        await createTransaction(formData)

        const account = availableAccounts.find((a) => a.id === accountId)
        const typeLabel =
          type === 'income'
            ? t('transactions.income')
            : t('transactions.expense')

        toast.success(
          t('transactions.transactionCreated', { type: typeLabel }),
          {
            description: `${type === 'income' ? '+' : '-'}$${formatMoney(amount, currency)} • ${account?.name || t('transactions.account')}`,
          }
        )
      }

      triggerRefresh()
      e.currentTarget?.reset()
      setTransactionType('')
      setIsOpen(false)
    } catch (error) {
      console.error('Error creating transaction/transfer:', error)
      toast.error(t('transactions.saveFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) {
          loadAvailableAccounts()
        } else {
          setTransactionType('')
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('transactions.addTransaction')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('accounts.description')}</DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.transactionType')}</Label>
            <Select
              name="type"
              required
              onValueChange={(value) => setTransactionType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t('transactions.selectTransactionType')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">
                  {t('transactions.income')}
                </SelectItem>
                <SelectItem value="expense">
                  {t('transactions.expense')}
                </SelectItem>
                <SelectItem value="transfer">
                  {t('transactions.transfer')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transactionType === 'transfer' ? (
            <>
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.fromAccount')}</Label>
                <Select name="fromAccountId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingAccounts
                          ? t('transactions.loadingAccounts')
                          : t('transactions.selectSourceAccount')
                      }
                    />
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
                <Select name="toAccountId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingAccounts
                          ? t('transactions.loadingAccounts')
                          : t('transactions.selectDestinationAccount')
                      }
                    />
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
            transactionType && (
              <div className="flex flex-col gap-1">
                <Label>{t('transactions.account')}</Label>
                <Select name="accountId" required>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loadingAccounts
                          ? t('transactions.loadingAccounts')
                          : t('transactions.selectAnAccount')
                      }
                    />
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
            )
          )}
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.amount')}</Label>
            <CurrencyInput name="amount" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.date')}</Label>
            <DatePicker name="date" />
          </div>
          {transactionType !== 'transfer' && (
            <div className="flex flex-col gap-1">
              <Label>{t('transactions.category')}</Label>
              <Input type="text" name="category" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label>{t('transactions.description')}</Label>
            <Textarea name="description" className="resize-none" required />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('transactions.creatingTransaction')}
              </>
            ) : (
              t('transactions.addTransaction')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
