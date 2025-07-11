'use client'

import { Accounts } from '@/components/dashboard/accounts'
import { Overview } from '@/components/dashboard/overview'
import { Transactions } from '@/components/dashboard/transactions'
import { useSearchParams } from 'next/navigation'

export default function Dashboard() {
  const searchParams = useSearchParams()
  const currentView = Array.from(searchParams.entries())[0]?.[0] || 'accounts'

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {currentView === 'accounts' && <Accounts />}
      {currentView === 'transactions' && <Transactions />}
      {currentView === 'overview' && <Overview />}
    </div>
  )
}
