import { getAccounts } from '@/app/dashboard/accounts/actions'
import { getOverviewData } from '@/app/dashboard/overview/actions'
import { updateLanguage } from '@/app/dashboard/profile/actions'
import {
  getTransactions,
  getTransfers,
} from '@/app/dashboard/transactions/actions'
import { CurrencyProvider } from '@/components/currency-provider'
import { QuickAddFab } from '@/components/dashboard/quick-add-fab'
import { LanguageProvider } from '@/components/language-provider'
import { QueryProvider } from '@/components/query-provider'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { prisma } from '@/lib/prisma'
import { queryKeys } from '@/lib/queries'
import { getServerSession } from '@/lib/session'
import type { Language } from '@/lib/translations'
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true, language: true },
      })
    : undefined

  const queryClient = new QueryClient()
  if (session) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.accounts,
        queryFn: getAccounts,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.overview,
        queryFn: getOverviewData,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.transactions,
        queryFn: getTransactions,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.transfers,
        queryFn: getTransfers,
      }),
    ])
  }

  return (
    <div className="flex flex-col">
      <LanguageProvider
        initialLanguage={user?.language as Language | undefined}
        onChange={session ? updateLanguage : undefined}
      >
        <SidebarProvider>
          <AppSidebar />
          <main className="flex min-h-svh w-full min-w-0 flex-col pt-14">
            <Header user={session?.user} />
            <CurrencyProvider currency={user?.currency ?? 'usd'}>
              <QueryProvider>
                <HydrationBoundary state={dehydrate(queryClient)}>
                  <div className="flex-1">{children}</div>
                  <QuickAddFab />
                </HydrationBoundary>
              </QueryProvider>
            </CurrencyProvider>
            <Footer />
          </main>
        </SidebarProvider>
      </LanguageProvider>
    </div>
  )
}
