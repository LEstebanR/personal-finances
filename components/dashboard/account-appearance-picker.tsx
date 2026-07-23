'use client'

import { uploadAccountLogo } from '@/app/dashboard/accounts/actions'
import { useLanguage } from '@/components/language-provider'
import { ACCOUNT_ICONS } from '@/lib/account-icons'
import { ACCOUNT_COLOR_PALETTE, suggestLogoUrl } from '@/lib/bank-logos'
import { cn } from '@/lib/utils'
import { Loader, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import { Label } from '../ui/label'

export function AccountAppearancePicker({
  accountName,
  color,
  onColorChange,
  logoUrl,
  onLogoChange,
  icon,
  onIconChange,
}: {
  accountName: string
  color: string | null
  onColorChange: (color: string | null) => void
  logoUrl: string | null
  onLogoChange: (logoUrl: string | null) => void
  icon: string | null
  onIconChange: (icon: string | null) => void
}) {
  const { t } = useLanguage()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const suggestedLogoUrl = accountName.trim()
    ? suggestLogoUrl(accountName)
    : null
  const isUsingSuggested =
    suggestedLogoUrl !== null && logoUrl === suggestedLogoUrl

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('logo', file)
      const url = await uploadAccountLogo(uploadData)
      onIconChange(null)
      onLogoChange(url)
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error(t('accounts.logoUploadFailed'))
    }
    setIsUploading(false)
  }

  const applyLogo = (url: string) => {
    onIconChange(null)
    onLogoChange(url)
  }

  const applyIcon = (name: string) => {
    onLogoChange(null)
    onIconChange(icon === name ? null : name)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label>{t('accounts.color')}</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLOR_PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={cn(
                'ring-offset-background h-7 w-7 rounded-full transition-all',
                color === swatch && 'ring-foreground ring-2 ring-offset-2'
              )}
              style={{ backgroundColor: swatch }}
              onClick={() => onColorChange(color === swatch ? null : swatch)}
              aria-label={swatch}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>{t('accounts.logo')}</Label>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border',
              !logoUrl && suggestedLogoUrl && 'border-dashed opacity-60'
            )}
          >
            {logoUrl || suggestedLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external/dynamic logo domains, not worth remotePatterns config
              <img
                src={logoUrl ?? suggestedLogoUrl ?? undefined}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {suggestedLogoUrl && !isUsingSuggested && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyLogo(suggestedLogoUrl)}
              >
                {t('accounts.useThisLogo')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {t('accounts.uploadYourOwn')}
            </Button>
            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onLogoChange(null)}
              >
                <X className="h-4 w-4" />
                {t('accounts.removeLogo')}
              </Button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>{t('accounts.icon')}</Label>
        <p className="text-muted-foreground text-xs">
          {t('accounts.iconDesc')}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACCOUNT_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              className={cn(
                'border-border flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                icon === name ? 'border-foreground bg-muted' : 'hover:bg-muted'
              )}
              onClick={() => applyIcon(name)}
              aria-label={name}
              aria-pressed={icon === name}
            >
              <Icon className="h-4 w-4" style={color ? { color } : undefined} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
