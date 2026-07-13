import { CurrencyProvider } from '@/components/currency-provider'
import { AddTransactionDialog } from '@/components/dashboard/add-transaction-dialog'
import { DashboardRefreshProvider } from '@/components/dashboard/refresh-provider'
import { AppSidebar } from '@/components/ui/app-sidebar'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { PlusIcon } from 'lucide-react'

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
              <AddTransactionDialog
                trigger={
                  <Button
                    size="icon"
                    className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg"
                  >
                    <PlusIcon className="size-6" />
                  </Button>
                }
              />
            </DashboardRefreshProvider>
          </CurrencyProvider>
          <Footer />
        </main>
      </SidebarProvider>
    </div>
  )
}
