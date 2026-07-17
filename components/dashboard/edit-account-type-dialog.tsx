'use client'

import { updateAccountType } from '@/app/dashboard/accounts/actions'
import { useLanguage } from '@/components/language-provider'
import { Loader } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useDashboardRefresh } from './refresh-provider'

interface Account {
  id: string
  name: string
  type: string
}

export function EditAccountTypeDialog({
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
  const [type, setType] = useState(account?.type ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!account) return
    setIsSubmitting(true)

    try {
      await updateAccountType(account.id, type)
      toast.success(t('accounts.typeUpdated'))
      triggerRefresh()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating account type:', error)
      toast.error(t('accounts.typeUpdateFailed'))
    }

    setIsSubmitting(false)
  }

  if (!account) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setType(account.type)
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('accounts.changeType', { name: account.name })}
          </DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label>{t('accounts.accountType')}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('accounts.cash')}</SelectItem>
                <SelectItem value="savings">{t('accounts.savings')}</SelectItem>
                <SelectItem value="caja">{t('accounts.caja')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
