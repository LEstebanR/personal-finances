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

  // Opening a Dialog synchronously from a DropdownMenuItem's onSelect races
  // with the menu's own close/pointer handling and the Dialog dismisses
  // itself immediately. Deferring to the next tick avoids the race.
  const openAfterMenuCloses = (setOpen: (open: boolean) => void) => {
    setTimeout(() => setOpen(true), 0)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="fixed right-6 bottom-6 z-50 h-16 w-16 rounded-full shadow-lg md:h-14 md:w-14"
          >
            <PlusIcon className="size-7 md:size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="min-w-72 p-2 md:min-w-[8rem] md:p-1"
        >
          <DropdownMenuItem
            onSelect={() => openAfterMenuCloses(setIsTransactionOpen)}
            className="gap-4 px-4 py-4 text-lg md:gap-2 md:px-2 md:py-1.5 md:text-sm [&_svg]:size-6 md:[&_svg]:size-4"
          >
            <CreditCard />
            {t('transactions.addTransaction')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openAfterMenuCloses(setIsAccountOpen)}
            className="gap-4 px-4 py-4 text-lg md:gap-2 md:px-2 md:py-1.5 md:text-sm [&_svg]:size-6 md:[&_svg]:size-4"
          >
            <Wallet />
            {t('accounts.addAccount')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => openAfterMenuCloses(setIsDebtOpen)}
            className="gap-4 px-4 py-4 text-lg md:gap-2 md:px-2 md:py-1.5 md:text-sm [&_svg]:size-6 md:[&_svg]:size-4"
          >
            <Landmark />
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
