'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Logo } from '@/components/ui/logo'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { supabase } from '@/utils/supabase.client'
import { AvatarFallback } from '@radix-ui/react-avatar'
import { User } from '@supabase/supabase-js'
import { LogIn, LogOut, MenuIcon, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar, AvatarImage } from './avatar'

function HeaderContent({ user, path }: { user?: User | null; path?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = Array.from(searchParams.entries())[0]?.[0]

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header
      className={`bg-background flex h-14 w-full items-center justify-between border-b px-4 ${path === '/' ? 'fixed top-0 right-0 left-0 z-50' : ''}`}
    >
      {path !== '/' ? (
        <>
          <div className="flex items-center gap-4">
            <SidebarTrigger />
          </div>
          <Link className="cursor-pointer md:hidden" href="/dashboard">
            <Logo />
          </Link>
          <h2 className="hidden text-lg font-bold capitalize md:block">
            {currentView}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="" alt={user?.user_metadata?.name} />
                <AvatarFallback>
                  {user
                    ? `${user.user_metadata?.name?.charAt(0).toUpperCase()}${user.user_metadata?.lastName?.charAt(0).toUpperCase()}`
                    : ''}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-2 rounded-t-none">
              <DropdownMenuLabel className="text-bold py-0">{`${user?.user_metadata.name} ${user?.user_metadata.lastName}`}</DropdownMenuLabel>
              <DropdownMenuLabel className="py-0 text-gray-500">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Link className="cursor-pointer" href="/">
            <Logo />
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Signup</Button>
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <MenuIcon className="md:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-3 w-screen rounded-t-none">
              <Link href="/login" className="flex items-center gap-2">
                <DropdownMenuItem>
                  <LogIn className="h-4 w-4" />
                  Login
                </DropdownMenuItem>
              </Link>
              <Link href="/signup" className="flex items-center gap-2">
                <DropdownMenuItem>
                  <UserPlus className="h-4 w-4" />
                  Signup
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </header>
  )
}

export function Header(props: { user?: User | null; path?: string }) {
  return (
    <Suspense fallback={<div className="h-14 w-full border-b" />}>
      <HeaderContent {...props} />
    </Suspense>
  )
}
