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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard</h1>
      <p>Hola, {user.user_metadata.name}</p>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  )
}
