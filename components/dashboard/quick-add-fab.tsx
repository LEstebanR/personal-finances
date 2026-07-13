'use client'

import { useLanguage } from '@/components/language-provider'
import { CreditCard, Landmark, PlusIcon, Wallet } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { AddAccountDialog } from './add-account-dialog'
import { AddDebtDialog } from './add-debt-dialog'
import { AddTransactionDialog } from './add-transaction-dialog'

export function QuickAddFab() {
  const { t } = useLanguage()
  const [isTransactionOpen, setIsTransactionOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isDebtOpen, setIsDebtOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg"
          >
            <PlusIcon className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem onSelect={() => setIsTransactionOpen(true)}>
            <CreditCard className="h-4 w-4" />
            {t('transactions.addTransaction')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsAccountOpen(true)}>
            <Wallet className="h-4 w-4" />
            {t('accounts.addAccount')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDebtOpen(true)}>
            <Landmark className="h-4 w-4" />
            {t('debts.addDebt')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddTransactionDialog
        open={isTransactionOpen}
        onOpenChange={setIsTransactionOpen}
      />
      <AddAccountDialog open={isAccountOpen} onOpenChange={setIsAccountOpen} />
      <AddDebtDialog open={isDebtOpen} onOpenChange={setIsDebtOpen} />
    </>
  )
}
