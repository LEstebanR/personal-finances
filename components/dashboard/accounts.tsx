'use client'

import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { useAccounts } from '@/lib/queries'
import { Loader, PiggyBank, PlusIcon, Wallet } from 'lucide-react'

import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AddAccountDialog } from './add-account-dialog'

interface Account {
  id: string
  userId: string
  name: string
  type: string
  initialBalance: number
  currentBalance: number
  description: string | null
  createdAt: Date
  isArchived: boolean
}

export function Accounts() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { data: accounts = [], isLoading: loading } = useAccounts()

  const filterAccountsByType = (type: 'all' | 'cash' | 'savings') => {
    if (type === 'all') return accounts
    return accounts.filter((account) => account.type === type)
  }

  const AccountCard = ({ account }: { account: Account }) => {
    const Icon = account.type === 'cash' ? Wallet : PiggyBank
    const typeLabel =
      account.type === 'cash' ? t('accounts.cash') : t('accounts.savings')

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Icon className="text-primary h-5 w-5" />
            </div>
            <span className="text-primary bg-primary/10 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              {typeLabel}
            </span>
          </div>
        </div>

        <h3 className="mb-2 truncate text-xl font-bold text-gray-900">
          {account.name}
        </h3>

        <div className="mb-4">
          <p className="mb-1 text-sm text-gray-500">
            {t('accounts.currentBalance')}
          </p>
          <p className="text-3xl font-bold text-gray-900">
            ${formatMoney(Number(account.currentBalance), currency)}
          </p>
        </div>
      </div>
    )
  }

  const EmptyState = ({ type }: { type: 'all' | 'cash' | 'savings' }) => {
    const Icon = type === 'cash' ? Wallet : PiggyBank
    const typeLabel =
      type === 'cash'
        ? t('accounts.cash')
        : type === 'savings'
          ? t('accounts.savings')
          : t('accounts.all')

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {t('accounts.noAccountsYet', { type: typeLabel })}
        </h3>
        <p className="mb-6 max-w-sm text-gray-500">
          {t('accounts.noAccountsYetDesc', { type: typeLabel.toLowerCase() })}
        </p>
        <AddAccountDialog
          defaultType={type === 'all' ? undefined : type}
          trigger={
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t('accounts.createTypeAccount', { type: typeLabel })}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
      <div className="flex w-full justify-between">
        <h1 className="text-2xl font-bold">{t('accounts.title')}</h1>
        <AddAccountDialog
          trigger={
            <Button>
              <PlusIcon className="size-4" />
              {t('accounts.addAccount')}
            </Button>
          }
        />
      </div>

      <div className="mt-6 w-full">
        {loading ? (
          <Loader className="m-auto h-8 w-8 animate-spin" />
        ) : accounts.length === 0 ? (
          <EmptyState type="all" />
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                {t('accounts.all')} ({accounts.length})
              </TabsTrigger>
              <TabsTrigger value="cash">
                {t('accounts.cash')} ({filterAccountsByType('cash').length})
              </TabsTrigger>
              <TabsTrigger value="savings">
                {t('accounts.savings')} (
                {filterAccountsByType('savings').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filterAccountsByType('all').map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cash" className="mt-6">
              {filterAccountsByType('cash').length === 0 ? (
                <EmptyState type="cash" />
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filterAccountsByType('cash').map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="savings" className="mt-6">
              {filterAccountsByType('savings').length === 0 ? (
                <EmptyState type="savings" />
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filterAccountsByType('savings').map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
