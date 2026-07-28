import { getAllPostsMeta } from '@/lib/blog'
import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lesfin.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const posts = [...getAllPostsMeta('en'), ...getAllPostsMeta('es')]
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.locale}/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  return [
    { url: siteUrl, lastModified, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${siteUrl}/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...postEntries,
    {
      url: `${siteUrl}/signup`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/login`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
