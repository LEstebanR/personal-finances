'use client'

import { AccountDetail } from '@/components/dashboard/account-detail'
import { Accounts } from '@/components/dashboard/accounts'
import { Budgets } from '@/components/dashboard/budgets'
import { Debts } from '@/components/dashboard/debts'
import { Overview } from '@/components/dashboard/overview'
import { Profile } from '@/components/dashboard/profile'
import { Settings } from '@/components/dashboard/settings'
import { SpendingTrends } from '@/components/dashboard/spending-trends'
import { Subscriptions } from '@/components/dashboard/subscriptions'
import { Transactions } from '@/components/dashboard/transactions'
import { useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const searchParams = useSearchParams()
  const currentView = Array.from(searchParams.entries())[0]?.[0] || 'overview'

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {currentView === 'accounts' && <Accounts />}
      {currentView === 'account' && <AccountDetail />}
      {currentView === 'transactions' && <Transactions />}
      {currentView === 'debts' && <Debts />}
      {currentView === 'budget' && <Budgets />}
      {currentView === 'subscriptions' && <Subscriptions />}
      {currentView === 'spending-trends' && <SpendingTrends />}
      {currentView === 'overview' && <Overview />}
      {currentView === 'profile' && <Profile />}
      {currentView === 'settings' && <Settings />}
    </div>
  )
}
