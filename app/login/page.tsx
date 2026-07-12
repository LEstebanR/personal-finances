'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GoogleSignInButton } from '@/components/ui/google-sign-in-button'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

export default function Login() {
  return (
    <div className="mx-auto mt-24 flex w-full flex-col items-center gap-4 px-4">
      <Link className="cursor-pointer" href="/">
        <Logo />
      </Link>
      <Card className="flex w-full flex-col md:w-4/12">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Welcome back!
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center text-lg">
            Sign in to access your account
          </CardDescription>
          <CardContent className="mt-4">
            <GoogleSignInButton />
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  )
}
