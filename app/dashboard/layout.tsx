import { AppSidebar } from '@/components/ui/app-sidebar'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/utils/supabase/client'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <Header user={user} />
          {children}
          <Footer />
        </main>
      </SidebarProvider>
    </div>
  )
}
