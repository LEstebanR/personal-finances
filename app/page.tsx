'use client'

import { useLanguage } from '@/components/language-provider'
import { DashboardPreview } from '@/components/marketing/dashboard-preview'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/ui/footer'
import { Header } from '@/components/ui/header'
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Home() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const steps = [
    {
      step: '01',
      title: t('landing.step1Title'),
      description: t('landing.step1Description'),
    },
    {
      step: '02',
      title: t('landing.step2Title'),
      description: t('landing.step2Description'),
    },
    {
      step: '03',
      title: t('landing.step3Title'),
      description: t('landing.step3Description'),
    },
  ]

  return (
    <div className="bg-background text-foreground flex flex-col items-center">
      <Header path={pathname} />

      <section id="hero" className="w-full px-4 pt-32 pb-24 md:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-primary mb-4 text-sm font-semibold tracking-widest uppercase">
              {t('landing.eyebrow')}
            </p>
            <h1 className="text-5xl leading-[1.05] font-bold tracking-tight md:text-6xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-muted-foreground mt-6 text-xl">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/signup">
                <Button size="lg">
                  {t('landing.getStarted')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  {t('landing.seeHowItWorks')}
                </Button>
              </Link>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="how-it-works" className="w-full px-4 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-3">
          <div>
            <h2 className="text-4xl font-bold tracking-tight">
              {t('landing.howItWorksTitle')}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>
          <div className="border-border space-y-10 divide-y lg:col-span-2">
            {steps.map((item) => (
              <div key={item.step} className="flex gap-6 pt-10 first:pt-0">
                <span className="text-muted-foreground/40 text-4xl font-bold">
                  {item.step}
                </span>
                <div>
                  <p className="text-xl font-semibold">{item.title}</p>
                  <p className="text-muted-foreground mt-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="w-full px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold tracking-tight">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            {t('landing.featuresSubtitle')}
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border-border bg-card rounded-2xl border p-8 md:col-span-2">
              <Banknote className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                {t('landing.feature1Title')}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {t('landing.feature1Description')}
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8">
              <ArrowLeftRight className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                {t('landing.feature2Title')}
              </h3>
              <p className="text-muted-foreground mt-2">
                {t('landing.feature2Description')}
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8">
              <TrendingUp className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                {t('landing.feature3Title')}
              </h3>
              <p className="text-muted-foreground mt-2">
                {t('landing.feature3Description')}
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8 md:col-span-2">
              <ShieldCheck className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                {t('landing.feature4Title')}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {t('landing.feature4Description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-24">
        <div className="bg-primary text-primary-foreground mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl px-8 py-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            {t('landing.ctaTitle')}
          </h2>
          <p className="max-w-xl text-lg opacity-80">
            {t('landing.ctaSubtitle')}
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-foreground">
              {t('landing.getStarted')} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
