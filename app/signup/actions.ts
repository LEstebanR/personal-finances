'use server'

import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const lastName = formData.get('lastName') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        lastName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}
