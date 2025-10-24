'use client'

import { Accounts } from '@/components/dashboard/accounts'
import { Overview } from '@/components/dashboard/overview'
import { Profile } from '@/components/dashboard/profile'
import { Transactions } from '@/components/dashboard/transactions'
import { useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const searchParams = useSearchParams()
  const currentView = Array.from(searchParams.entries())[0]?.[0] || 'overview'

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {currentView === 'accounts' && <Accounts />}
      {currentView === 'transactions' && <Transactions />}
      {currentView === 'overview' && <Overview />}
      {currentView === 'profile' && <Profile />}
    </div>
  )
}
