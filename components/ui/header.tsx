'use client'

import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Logo } from '@/components/ui/logo'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { AvatarFallback } from '@radix-ui/react-avatar'
import { LogIn, LogOut, MenuIcon, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar, AvatarImage } from './avatar'

type HeaderUser = {
  name: string
  email: string
  image?: string | null
}

function HeaderContent({
  user,
  path,
}: {
  user?: HeaderUser | null
  path?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = Array.from(searchParams.entries())[0]?.[0]
  const { t } = useLanguage()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/')
  }

  const viewTitle = currentView
    ? (t(`nav.${currentView}`) ?? currentView)
    : t('nav.accounts')

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
            {viewTitle}
          </h2>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={user?.image ?? ''} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() ?? ''}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mt-2 rounded-t-none">
                <DropdownMenuLabel className="text-bold py-0">
                  {user?.name}
                </DropdownMenuLabel>
                <DropdownMenuLabel className="py-0 text-gray-500">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t('header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      ) : (
        <div className="gap-4w-full mx-auto flex w-full border-spacing-7 items-center justify-between md:w-8/12">
          <Link className="cursor-pointer" href="/">
            <Logo />
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <LanguageToggle />
            <Link href="/login">
              <Button variant="outline">{t('header.login')}</Button>
            </Link>
            <Link href="/signup">
              <Button>{t('header.signup')}</Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MenuIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mt-3 w-screen rounded-t-none">
                <Link href="/login" className="flex items-center gap-2">
                  <DropdownMenuItem>
                    <LogIn className="h-4 w-4" />
                    {t('header.login')}
                  </DropdownMenuItem>
                </Link>
                <Link href="/signup" className="flex items-center gap-2">
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4" />
                    {t('header.signup')}
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </header>
  )
}

export function Header(props: { user?: HeaderUser | null; path?: string }) {
  return (
    <Suspense fallback={<div className="h-14 w-full border-b" />}>
      <HeaderContent {...props} />
    </Suspense>
  )
}
