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
import { CreditCard, Home, Settings, User, Wallet } from 'lucide-react'
import Link from 'next/link'

import { Logo } from './logo'

const OPTIONS_MENU = [
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
  {
    icon: <CreditCard />,
    label: 'Transactions',
    href: '?transactions',
  },
]

const OPTIONS_SETTINGS = [
  {
    icon: <User />,
    label: 'Profile',
    href: '?profile',
  },
  {
    icon: <Settings />,
    label: 'Settings',
    href: '?settings',
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
              {OPTIONS_MENU.map((option) => {
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
        <SidebarGroup>
          <SidebarGroupLabel>User Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {OPTIONS_SETTINGS.map((option) => {
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
