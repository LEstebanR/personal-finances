'use client'

import { createAccount } from '@/app/dashboard/accounts/actions'
import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { Loader } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { CurrencyInput } from '../ui/currency-input'
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
import { AccountAppearancePicker } from './account-appearance-picker'
import { useDashboardRefresh } from './refresh-provider'

export function AddAccountDialog({
  trigger,
  defaultType,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  trigger?: React.ReactNode
  defaultType?: 'cash' | 'savings' | 'caja'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = setControlledOpen ?? setInternalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [type, setType] = useState(defaultType ?? 'savings')
  const [color, setColor] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [icon, setIcon] = useState<string | null>(null)

  const resetAppearance = () => {
    setAccountName('')
    setType(defaultType ?? 'savings')
    setColor(null)
    setLogoUrl(null)
    setIcon(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)

    try {
      const account = await createAccount(formData)
      toast.success(t('accounts.accountCreated', { name: account.name }), {
        description: t('accounts.accountCreatedDesc', {
          amount: formatMoney(account.currentBalance, currency),
        }),
      })
      triggerRefresh()
      e.currentTarget?.reset()
      resetAppearance()
      setIsOpen(false)
    } catch (error) {
      console.error('Insert error:', error)
      toast.error(t('accounts.accountCreateFailed'))
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accounts.addAccount')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('accounts.dialogDescription')}</DialogDescription>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.accountName')}</Label>
            <Input
              type="text"
              name="accountName"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.accountType')}</Label>
            <Select
              name="accountType"
              required
              value={type}
              onValueChange={(value) =>
                setType(value as 'cash' | 'savings' | 'caja')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('accounts.selectAccountType')}>
                  {t(`accounts.${type}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('accounts.cash')}</SelectItem>
                <SelectItem value="savings">{t('accounts.savings')}</SelectItem>
                <SelectItem value="caja">{t('accounts.caja')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.initialBalance')}</Label>
            <CurrencyInput name="initialBalance" required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.description')}</Label>
            <Textarea name="description" className="resize-none" />
          </div>
          <AccountAppearancePicker
            accountName={accountName}
            color={color}
            onColorChange={setColor}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            icon={icon}
            onIconChange={setIcon}
          />
          <input type="hidden" name="color" value={color ?? ''} />
          <input type="hidden" name="logoUrl" value={logoUrl ?? ''} />
          <input type="hidden" name="icon" value={icon ?? ''} />
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('accounts.creatingAccount')}
              </>
            ) : (
              t('accounts.addAccount')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
