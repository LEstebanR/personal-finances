'use client'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
  }

  return (
    <Button className="w-full" onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Redirecting to Google...' : 'Continue with Google'}
    </Button>
  )
}
