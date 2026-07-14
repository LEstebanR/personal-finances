'use client'

import { useQueryClient } from '@tanstack/react-query'

export function useDashboardRefresh() {
  const queryClient = useQueryClient()

  return {
    triggerRefresh: () => queryClient.invalidateQueries(),
  }
}
