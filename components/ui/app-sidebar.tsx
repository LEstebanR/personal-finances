import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Home, Wallet } from 'lucide-react'
import Link from 'next/link'

import { Logo } from './logo'

const OPTIONS = [
  {
    icon: <Home />,
    label: 'Overview',
    href: '?overview',
  },
  {
    icon: <Wallet />,
    label: 'Accounts',
    href: '?accounts',
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {OPTIONS.map((option) => {
                return (
                  <SidebarMenuItem key={option.label}>
                    <SidebarMenuButton className="cursor-pointer" asChild>
                      <Link href={option.href}>
                        {option.icon} {option.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
