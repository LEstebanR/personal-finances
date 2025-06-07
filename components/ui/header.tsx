'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Logo } from '@/components/ui/logo'
import { DollarSign, LayoutDashboard, LogIn, MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <header className="bg-background fixed top-0 right-0 left-0 z-50 flex h-14 w-full items-center justify-between px-4">
      <Logo />
      <div className="hidden items-center gap-4 md:flex">
        <Link href="/#features">Features</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/login">
          <Button variant="outline">Login</Button>
        </Link>
        <Link href="/signup">
          <Button>Signup</Button>
        </Link>
      </div>
      <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
        <DropdownMenuTrigger asChild>
          <MenuIcon className="md:hidden" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setIsOpen(false)}>
            <Link href="/#features" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Features
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsOpen(false)}>
            <Link href="/#pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsOpen(false)}>
            <Link href="/login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsOpen(false)}>
            <Link href="/signup" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Signup
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
