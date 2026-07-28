import { BlogIndex } from '@/components/blog/blog-index'
import { getAllPostsMeta } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Practical, general-purpose guides on budgeting, debt, subscriptions, and everyday money habits.',
  alternates: { canonical: '/blog' },
}

export default function Page() {
  const postsByLocale = {
    en: getAllPostsMeta('en'),
    es: getAllPostsMeta('es'),
  }

  return <BlogIndex postsByLocale={postsByLocale} />
}
