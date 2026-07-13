'use client'

import { getProfile, updateProfile } from '@/app/dashboard/profile/actions'
import { useLanguage } from '@/components/language-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TimezoneCombobox } from '@/components/ui/timezone-combobox'
import {
  Calendar,
  Loader,
  Save,
  Shield,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ProfileData {
  name: string
  email: string
  image: string | null
  currency: string
  timezone: string
  budgetPeriod: string
  memberSince: Date
  totalTransactions: number
  totalAccounts: number
}

export function Profile() {
  const { t, language } = useLanguage()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((error) => console.error('Error loading profile:', error))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)

    try {
      const updated = await updateProfile(formData)
      setProfile((prev) => (prev ? { ...prev, name: updated.name } : prev))
      toast.success(t('profile.updateSuccess'))
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(t('profile.updateFailed'))
    }

    setIsSaving(false)
  }

  if (loading || !profile) {
    return (
      <div className="flex w-full flex-col gap-4 rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4 rounded-md p-4 md:mt-4 md:w-11/12 md:border md:p-8"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {t('profile.title')}
        </h2>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {t('profile.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('profile.saveChanges')}
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{t('profile.account')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.image ?? ''} alt={profile.name} />
              <AvatarFallback>
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <p className="font-medium">{profile.name}</p>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
              <Badge variant="secondary">
                {t('profile.signedInWithGoogle')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('profile.personalInformation')}</CardTitle>
            <CardDescription>{t('profile.updateYourName')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.name')}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input id="email" value={profile.email} disabled />
              <p className="text-muted-foreground text-xs">
                {t('profile.managedByGoogle')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.financialPreferences')}</CardTitle>
          <CardDescription>
            {t('profile.configureFinancialSettings')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currency">{t('profile.defaultCurrency')}</Label>
            <Select name="currency" defaultValue={profile.currency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD - US Dollar</SelectItem>
                <SelectItem value="eur">EUR - Euro</SelectItem>
                <SelectItem value="gbp">GBP - British Pound</SelectItem>
                <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="cop">COP - Colombian Peso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">{t('profile.timezone')}</Label>
            <TimezoneCombobox name="timezone" defaultValue={profile.timezone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetPeriod">{t('profile.budgetPeriod')}</Label>
            <Select name="budgetPeriod" defaultValue={profile.budgetPeriod}>
              <SelectTrigger id="budgetPeriod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">{t('profile.weekly')}</SelectItem>
                <SelectItem value="monthly">{t('profile.monthly')}</SelectItem>
                <SelectItem value="quarterly">
                  {t('profile.quarterly')}
                </SelectItem>
                <SelectItem value="yearly">{t('profile.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.accountStatistics')}</CardTitle>
          <CardDescription>{t('profile.yourActivity')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Calendar className="text-primary h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {t('profile.memberSince')}
                </p>
                <p className="font-medium">
                  {profile.memberSince.toLocaleDateString(
                    language === 'es' ? 'es-ES' : 'en-US',
                    { month: 'long', year: 'numeric' }
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Wallet className="text-primary h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {t('profile.accounts')}
                </p>
                <p className="font-medium">{profile.totalAccounts}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-primary h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {t('profile.totalTransactions')}
                </p>
                <p className="font-medium">{profile.totalTransactions}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="text-primary h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {t('profile.signInMethod')}
                </p>
                <p className="font-medium">Google</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
