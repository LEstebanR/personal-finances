import { CurrencyProvider } from '@/components/currency-provider'
import { QuickAddFab } from '@/components/dashboard/quick-add-fab'
import { DashboardRefreshProvider } from '@/components/dashboard/refresh-provider'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  const currency = session
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { currency: true },
        })
      )?.currency
    : undefined

  return (
    <div className="flex flex-col">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex min-h-svh w-full flex-col">
          <Header user={session?.user} />
          <CurrencyProvider currency={currency ?? 'usd'}>
            <DashboardRefreshProvider>
              <div className="flex-1">{children}</div>
              <QuickAddFab />
            </DashboardRefreshProvider>
          </CurrencyProvider>
          <Footer />
        </main>
      </SidebarProvider>
    </div>
  )
}
