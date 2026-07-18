'use client'

import { updateAccount } from '@/app/dashboard/accounts/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
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
import { AccountAppearancePicker } from './account-appearance-picker'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
  description?: string | null
  color?: string | null
  logoUrl?: string | null
  icon?: string | null
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
}: {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useLanguage()
  const { triggerRefresh } = useDashboardRefresh()
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState(account?.type ?? '')
  const [description, setDescription] = useState(account?.description ?? '')
  const [color, setColor] = useState<string | null>(account?.color ?? null)
  const [logoUrl, setLogoUrl] = useState<string | null>(
    account?.logoUrl ?? null
  )
  const [icon, setIcon] = useState<string | null>(account?.icon ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // This dialog has no DialogTrigger — the parent opens it by flipping the
  // controlled `open` prop directly, which Radix's onOpenChange never fires
  // for (only its own internal close/open does). Sync fields off the
  // account prop itself instead, whenever a different account comes in.
  useEffect(() => {
    if (!account) return
    setName(account.name)
    setType(account.type)
    setDescription(account.description ?? '')
    setColor(account.color ?? null)
    setLogoUrl(account.logoUrl ?? null)
    setIcon(account.icon ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!account) return
    setIsSubmitting(true)

    try {
      await updateAccount(account.id, {
        name,
        type,
        description: description || null,
        color,
        logoUrl,
        icon,
      })
      toast.success(t('accounts.typeUpdated'))
      triggerRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error(t('accounts.typeUpdateFailed'))
    }

    setIsSubmitting(false)
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('accounts.changeType', { name: account.name })}
          </DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.accountName')}</Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.accountType')}</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('accounts.selectAccountType')}>
                  {type && t(`accounts.${type}`)}
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
            <Label>{t('accounts.description')}</Label>
            <Textarea
              className="resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <AccountAppearancePicker
            accountName={name}
            color={color}
            onColorChange={setColor}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            icon={icon}
            onIconChange={setIcon}
          />
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              t('accounts.saveChanges')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
