'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface DashboardRefreshContextValue {
  refreshKey: number
  triggerRefresh: () => void
}

const DashboardRefreshContext = createContext<DashboardRefreshContextValue>({
  refreshKey: 0,
  triggerRefresh: () => {},
})

export function DashboardRefreshProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [refreshKey, setRefreshKey] = useState(0)
  const triggerRefresh = useCallback(() => setRefreshKey((key) => key + 1), [])

  return (
    <DashboardRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DashboardRefreshContext.Provider>
  )
}

export function useDashboardRefresh() {
  return useContext(DashboardRefreshContext)
}
