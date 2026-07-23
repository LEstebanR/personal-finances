'use client'

import { useLanguage } from '@/components/language-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  CreditCard,
  Home,
  Landmark,
  PiggyBank,
  Repeat,
  Settings,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { Logo } from './logo'

function AppSidebarContent() {
  const { isMobile, setOpenMobile } = useSidebar()
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const currentView = Array.from(searchParams.entries())[0]?.[0] || 'overview'

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  const optionsMenu = [
    { icon: <Home />, label: t('nav.overview'), href: '?overview' },
    { icon: <Wallet />, label: t('nav.accounts'), href: '?accounts' },
    {
      icon: <CreditCard />,
      label: t('nav.transactions'),
      href: '?transactions',
    },
    { icon: <Landmark />, label: t('nav.debts'), href: '?debts' },
    { icon: <PiggyBank />, label: t('nav.budget'), href: '?budget' },
    {
      icon: <Repeat />,
      label: t('nav.subscriptions'),
      href: '?subscriptions',
    },
    {
      icon: <TrendingUp />,
      label: t('nav.spendingTrends'),
      href: '?spending-trends',
    },
  ]

  const optionsSettings = [
    { icon: <User />, label: t('nav.profile'), href: '?profile' },
    { icon: <Settings />, label: t('nav.settings'), href: '?settings' },
  ]

  return (
    <Sidebar className="">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {optionsMenu.map((option) => {
                const isActive = currentView === option.href.slice(1)
                return (
                  <SidebarMenuItem key={option.href}>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      isActive={isActive}
                      asChild
                    >
                      <Link href={option.href} onClick={closeOnMobile}>
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
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.userSettings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {optionsSettings.map((option) => {
                const isActive = currentView === option.href.slice(1)
                return (
                  <SidebarMenuItem key={option.href}>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      isActive={isActive}
                      asChild
                    >
                      <Link href={option.href} onClick={closeOnMobile}>
                        {option.icon} {option.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebar() {
  return (
    <Suspense fallback={<Sidebar className="" />}>
      <AppSidebarContent />
    </Suspense>
  )
}
