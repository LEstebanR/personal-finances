'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/ui/logo'
import { supabase } from '@/utils/supabase.client'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  lastName: string
  password: string
  confirmPassword: string
}

const initialUser: User = {
  id: '',
  email: '',
  name: '',
  lastName: '',
  password: '',
  confirmPassword: '',
}

export default function Signup() {
  const [user, setUser] = useState<User>(initialUser)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (user.password !== user.confirmPassword) {
      console.log('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name,
          lastName: user.lastName,
        },
      },
    })

    if (error) {
      toast.error(error.message)
    }

    console.log(data)
  }

  return (
    <div className="mx-auto mt-24 flex w-full flex-col items-center gap-4 px-4">
      <Link href="/" className="cursor-pointer">
        <Logo />
      </Link>
      <Card className="flex w-full flex-col md:w-4/12">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center text-lg">
            Enter your information to create an account
          </CardDescription>
          <CardContent>
            <form
              className="mt-4 flex w-full flex-col gap-6"
              onSubmit={handleSignup}
            >
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={user.name}
                    onChange={(e) =>
                      setUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={user.lastName}
                    onChange={(e) =>
                      setUser((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={user.email}
                  onChange={(e) =>
                    setUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={user.password}
                  onChange={(e) =>
                    setUser((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={user.confirmPassword}
                  onChange={(e) =>
                    setUser((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <Button type="submit">Create account</Button>
            </form>
          </CardContent>
          <CardFooter className="mt-4 flex flex-col gap-2">
            <p className="text-muted-foreground text-center text-lg">
              Already have an account?{' '}
              <Link href="/login" className="text-primary">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </CardHeader>
      </Card>
    </div>
  )
}
