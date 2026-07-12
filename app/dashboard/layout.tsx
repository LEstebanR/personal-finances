import { AppSidebar } from '@/components/ui/app-sidebar'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getServerSession } from '@/lib/session'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  return (
    <div className="flex flex-col">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header user={session?.user} />
          {children}
          <Footer />
        </main>
      </SidebarProvider>
    </div>
  )
}
