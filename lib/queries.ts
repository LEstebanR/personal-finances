import { getAccounts } from '@/app/dashboard/accounts/actions'
import {
  getBudgetItems,
  getBudgetOverview,
} from '@/app/dashboard/budgets/actions'
import {
  getCategories,
  getSubcategories,
} from '@/app/dashboard/categories/actions'
import { getDebts } from '@/app/dashboard/debts/actions'
import { getOverviewData } from '@/app/dashboard/overview/actions'
import { getCategoryMonthlyTotals } from '@/app/dashboard/spending-trends/actions'
import { getSubscriptions } from '@/app/dashboard/subscriptions/actions'
import {
  getTransactions,
  getTransfers,
} from '@/app/dashboard/transactions/actions'
import { useQuery } from '@tanstack/react-query'

export const queryKeys = {
  accounts: ['accounts'] as const,
  debts: ['debts'] as const,
  subscriptions: ['subscriptions'] as const,
  categories: (type?: 'income' | 'expense') => ['categories', type] as const,
  subcategories: (categoryId: string) => ['subcategories', categoryId] as const,
  transactions: ['transactions'] as const,
  transfers: ['transfers'] as const,
  overview: ['overview'] as const,
  budgetOverview: (month: number, year: number) =>
    ['budget-overview', month, year] as const,
  budgetItems: (month: number, year: number) =>
    ['budget-items', month, year] as const,
  categoryMonthlyTotals: (year: number) =>
    ['category-monthly-totals', year] as const,
}

export function useAccounts() {
  return useQuery({ queryKey: queryKeys.accounts, queryFn: getAccounts })
}

export function useDebts() {
  return useQuery({ queryKey: queryKeys.debts, queryFn: getDebts })
}

export function useSubscriptions() {
  return useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: getSubscriptions,
  })
}

export function useCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: queryKeys.categories(type),
    queryFn: () => getCategories(type),
  })
}

export function useSubcategories(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.subcategories(categoryId),
    queryFn: () => getSubcategories(categoryId),
    enabled: !!categoryId,
  })
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: getTransactions,
  })
}

export function useTransfers() {
  return useQuery({ queryKey: queryKeys.transfers, queryFn: getTransfers })
}

export function useOverviewData() {
  return useQuery({ queryKey: queryKeys.overview, queryFn: getOverviewData })
}

export function useBudgetOverview(month: number, year: number) {
  return useQuery({
    queryKey: queryKeys.budgetOverview(month, year),
    queryFn: () => getBudgetOverview(month, year),
  })
}

export function useBudgetItems(month: number, year: number) {
  return useQuery({
    queryKey: queryKeys.budgetItems(month, year),
    queryFn: () => getBudgetItems(month, year),
  })
}

export function useCategoryMonthlyTotals(year: number) {
  return useQuery({
    queryKey: queryKeys.categoryMonthlyTotals(year),
    queryFn: () => getCategoryMonthlyTotals(year),
  })
}
