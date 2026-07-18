'use client'

import { useCurrency } from '@/components/currency-provider'
import { useLanguage } from '@/components/language-provider'
import { formatMoney } from '@/lib/currency'
import { getAccountIcon } from '@/lib/account-icons'
import { useAccounts } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { Loader, Lock, Pencil, PiggyBank, PlusIcon, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AddAccountDialog } from './add-account-dialog'
import { EditAccountDialog } from './edit-account-dialog'

interface Account {
  id: string
  userId: string
  name: string
  type: string
  initialBalance: number
  currentBalance: number
  description: string | null
  color: string | null
  logoUrl: string | null
  icon: string | null
  createdAt: Date
  isArchived: boolean
}

export function Accounts() {
  const currency = useCurrency()
  const { t } = useLanguage()
  const { data: accounts = [], isLoading: loading } = useAccounts()
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const filterAccountsByType = (type: 'all' | 'cash' | 'savings' | 'caja') => {
    const filtered =
      type === 'all' ? accounts : accounts.filter((a) => a.type === type)
    return [...filtered].sort((a, b) => b.currentBalance - a.currentBalance)
  }

  const getAccountTypeMeta = (type: string) => {
    if (type === 'cash') return { Icon: Wallet, label: t('accounts.cash') }
    if (type === 'caja') return { Icon: Lock, label: t('accounts.caja') }
    return { Icon: PiggyBank, label: t('accounts.savings') }
  }

  const AccountCard = ({ account }: { account: Account }) => {
    const { Icon: TypeIcon, label: typeLabel } = getAccountTypeMeta(
      account.type
    )
    const Icon = getAccountIcon(account.icon) ?? TypeIcon

    return (
      <div
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        style={
          account.color
            ? {
                borderLeftColor: account.color,
                borderLeftWidth: '4px',
              }
            : undefined
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {account.logoUrl ? (
              <div className="bg-muted h-9 w-9 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element -- external/dynamic logo domains, not worth remotePatterns config */}
                <img
                  src={account.logoUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className={cn('rounded-lg p-2', !account.color && 'bg-primary/10')}
                style={
                  account.color
                    ? { backgroundColor: `${account.color}26` }
                    : undefined
                }
              >
                <Icon
                  className={cn('h-5 w-5', !account.color && 'text-primary')}
                  style={account.color ? { color: account.color } : undefined}
                />
              </div>
            )}
            <span className="text-primary bg-primary/10 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              {typeLabel}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditingAccount(account)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Link href={`?account&id=${account.id}`} className="block">
          <h3 className="mb-2 truncate text-xl font-bold text-gray-900">
            {account.name}
          </h3>

          <div className="mb-4">
            <p className="mb-1 text-sm text-gray-500">
              {t('accounts.currentBalance')}
            </p>
            <p
              className={`text-3xl font-bold ${
                account.currentBalance < 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              ${formatMoney(Number(account.currentBalance), currency)}
            </p>
          </div>
        </Link>
      </div>
    )
  }

  const EmptyState = ({
    type,
  }: {
    type: 'all' | 'cash' | 'savings' | 'caja'
  }) => {
    const EmptyIcon = type === 'all' ? Wallet : getAccountTypeMeta(type).Icon
    const typeLabel =
      type === 'all' ? t('accounts.all') : getAccountTypeMeta(type).label

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <EmptyIcon className="mb-4 h-16 w-16 text-gray-300" />
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
            <TabsList className="grid w-full grid-cols-4">
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
              <TabsTrigger value="caja">
                {t('accounts.caja')} ({filterAccountsByType('caja').length})
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

            <TabsContent value="caja" className="mt-6">
              {filterAccountsByType('caja').length === 0 ? (
                <EmptyState type="caja" />
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filterAccountsByType('caja').map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <EditAccountDialog
        account={editingAccount}
        open={!!editingAccount}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null)
        }}
      />
    </div>
  )
}
