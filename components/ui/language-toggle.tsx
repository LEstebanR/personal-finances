'use client'

import { useLanguage } from '@/components/language-provider'

import { Switch } from './switch'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={
          language === 'en' ? 'font-semibold' : 'text-muted-foreground'
        }
      >
        EN
      </span>
      <Switch
        checked={language === 'es'}
        onCheckedChange={(checked) => setLanguage(checked ? 'es' : 'en')}
        aria-label="Toggle language"
      />
      <span
        className={
          language === 'es' ? 'font-semibold' : 'text-muted-foreground'
        }
      >
        ES
      </span>
    </div>
  )
}
