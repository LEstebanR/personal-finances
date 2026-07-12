'use client'

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

const steps = [
  {
    step: '01',
    title: 'Create your accounts',
    description:
      'Add your cash and savings accounts to track balances in one place.',
  },
  {
    step: '02',
    title: 'Log transactions & transfers',
    description: 'Record income and expenses, and move money between accounts.',
  },
  {
    step: '03',
    title: 'See your overview',
    description:
      'Get a clear picture of your total balance and monthly activity.',
  },
]

export default function Home() {
  const pathname = usePathname()

  return (
    <div className="bg-background text-foreground flex flex-col items-center">
      <Header path={pathname} />

      <section id="hero" className="w-full px-4 pt-32 pb-24 md:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-primary mb-4 text-sm font-semibold tracking-widest uppercase">
              A tool I built for myself
            </p>
            <h1 className="text-5xl leading-[1.05] font-bold tracking-tight md:text-6xl">
              Know exactly where your money stands.
            </h1>
            <p className="text-muted-foreground mt-6 text-xl">
              No spreadsheets, no guessing. Every account, every transaction,
              every transfer — one clear view of your money.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/signup">
                <Button size="lg">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline">
                  See how it works
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
            <h2 className="text-4xl font-bold tracking-tight">How it works</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Three steps to a clear picture of your money.
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
          <h2 className="text-4xl font-bold tracking-tight">Features</h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg">
            Nothing you don&apos;t need. Everything you do.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border-border bg-card rounded-2xl border p-8 md:col-span-2">
              <Banknote className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                Every account, one place
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Cash, savings, whatever you&apos;ve got — track balances across
                all your accounts without switching between apps.
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8">
              <ArrowLeftRight className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">Log it in seconds</h3>
              <p className="text-muted-foreground mt-2">
                Income, expenses, transfers between accounts — just what
                happened and how much.
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8">
              <TrendingUp className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                See the full picture
              </h3>
              <p className="text-muted-foreground mt-2">
                Total balance, income vs. expenses, net — updated the moment you
                log something.
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-8 md:col-span-2">
              <ShieldCheck className="text-primary h-8 w-8" />
              <h3 className="mt-4 text-2xl font-semibold">
                Sign in with Google
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                No password to remember or leak. One click and you&apos;re in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-24">
        <div className="bg-primary text-primary-foreground mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl px-8 py-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Ready to take control of your money?
          </h2>
          <p className="max-w-xl text-lg opacity-80">
            Sign in with Google and start tracking your finances in seconds.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-foreground">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
