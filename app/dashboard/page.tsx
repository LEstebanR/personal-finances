'use client'

import { supabase } from '@/utils/supabase.client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Dashboard() {
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
    <div className="flex w-full flex-col items-center justify-center">
      Hola {user?.user_metadata.name}
    </div>
  )
}
