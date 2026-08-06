'use client'

import { useLanguage } from '@/components/language-provider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'

import { CategoryManager } from './category-manager'

export function Settings() {
  const { t } = useLanguage()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const serverUrl = `${origin || 'https://your-domain.com'}/api/mcp`

  return (
    <div className="flex w-full flex-col gap-4 rounded-md p-4 md:mt-4 md:w-11/12 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
          <CardDescription>{t('settings.languageDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.mcpTitle')}</CardTitle>
          <CardDescription>{t('settings.mcpDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="mb-1 font-medium">{t('settings.mcpEndpointLabel')}</p>
            <code className="bg-muted block rounded px-3 py-2 font-mono text-xs break-all">
              {serverUrl}
            </code>
          </div>
          <div>
            <p className="mb-1 font-medium">
              {t('settings.mcpWebMobileLabel')}
            </p>
            <p className="text-muted-foreground">
              {t('settings.mcpWebMobileDesc')}
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium">{t('settings.mcpConnectLabel')}</p>
            <pre className="bg-muted overflow-x-auto rounded px-3 py-2 font-mono text-xs">
              {`claude mcp add --transport http personal-finances ${serverUrl} --header "Authorization: Bearer YOUR_API_KEY"`}
            </pre>
            <p className="text-muted-foreground mt-1">
              {t('settings.mcpKeyNote')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.categories')}</CardTitle>
          <CardDescription>{t('settings.categoriesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expense" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">
                {t('transactions.expense')}
              </TabsTrigger>
              <TabsTrigger value="income">
                {t('transactions.income')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="expense" className="mt-4">
              <CategoryManager type="expense" />
            </TabsContent>
            <TabsContent value="income" className="mt-4">
              <CategoryManager type="income" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
