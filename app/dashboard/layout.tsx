'use client'

import { AppSidebar } from '@/components/ui/app-sidebar'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { supabase } from '@/utils/supabase.client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }
      setUser(user)
    }
    getUser()
  }, [router])

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
