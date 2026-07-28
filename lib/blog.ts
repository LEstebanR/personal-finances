import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import readingTime from 'reading-time'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

export type BlogLocale = 'en' | 'es'

export interface BlogPostMeta {
  slug: string
  locale: BlogLocale
  id: string
  title: string
  description: string
  date: string
  readingMinutes: number
}

export interface BlogPost extends BlogPostMeta {
  html: string
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

function localeDir(locale: BlogLocale) {
  return path.join(BLOG_DIR, locale)
}

function readPostFile(locale: BlogLocale, slug: string) {
  const filePath = path.join(localeDir(locale), `${slug}.md`)
  const raw = fs.readFileSync(filePath, 'utf8')
  return matter(raw)
}

export function getPostSlugs(locale: BlogLocale): string[] {
  const dir = localeDir(locale)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''))
}

function toMeta(
  locale: BlogLocale,
  slug: string,
  data: Record<string, unknown>,
  content: string
): BlogPostMeta {
  return {
    slug,
    locale,
    id: String(data.id),
    title: String(data.title),
    description: String(data.description),
    date: String(data.date),
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
  }
}

export function getPostMeta(
  locale: BlogLocale,
  slug: string
): BlogPostMeta | null {
  try {
    const { data, content } = readPostFile(locale, slug)
    return toMeta(locale, slug, data, content)
  } catch {
    return null
  }
}

export async function getPost(
  locale: BlogLocale,
  slug: string
): Promise<BlogPost | null> {
  try {
    const { data, content } = readPostFile(locale, slug)
    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml)
      .process(content)

    return {
      ...toMeta(locale, slug, data, content),
      html: processed.toString(),
    }
  } catch {
    return null
  }
}

export function getAllPostsMeta(locale: BlogLocale): BlogPostMeta[] {
  return getPostSlugs(locale)
    .map((slug) => getPostMeta(locale, slug))
    .filter((post): post is BlogPostMeta => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

// Cross-links a post to its counterpart in the other language, matched by
// the shared frontmatter `id` rather than slug — the two versions rarely
// share the same URL-friendly words.
export function getTranslationSlug(
  locale: BlogLocale,
  id: string
): string | undefined {
  const otherLocale: BlogLocale = locale === 'en' ? 'es' : 'en'
  return getAllPostsMeta(otherLocale).find((post) => post.id === id)?.slug
}
