'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { requiredString, uuidField } from '@/lib/validation'
import { z } from 'zod'

const categoryNameSchema = requiredString
const categoryTypeSchema = z.enum(['income', 'expense'])

const DEFAULT_EXPENSE_CATEGORIES = [
  'Alimentación',
  'Caridad',
  'Deuda',
  'Educación',
  'Entretenimiento',
  'Familia',
  'Hogar',
  'Legal',
  'Mascotas',
  'Regalos',
  'Ropa',
  'Salud',
  'Servicios',
  'Transporte',
  'Otros',
]

const DEFAULT_INCOME_CATEGORIES = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Reembolsos',
  'Regalos recibidos',
  'Otros ingresos',
]

function findMissingDefaults(existing: { name: string; type: string }[]) {
  const existingKeys = new Set(
    existing.map((c) => `${c.type}:${c.name.trim().toLowerCase()}`)
  )
  const defaults = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      name,
      type: 'expense' as const,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
      name,
      type: 'income' as const,
    })),
  ]
  return defaults.filter(
    ({ name, type }) => !existingKeys.has(`${type}:${name.toLowerCase()}`)
  )
}

export async function getCategoriesForUser(
  userId: string,
  type?: 'income' | 'expense'
) {
  const where = { userId, ...(type ? { type } : {}) }
  const categories = await prisma.category.findMany({
    where,
    include: { subcategories: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  })

  // Defaults are seeded once per user; checking against the type-filtered
  // list would false-positive on "missing" categories of the other type, so
  // check against the user's full category list instead.
  const allCategories =
    type === undefined
      ? categories
      : await prisma.category.findMany({
          where: { userId },
          select: { name: true, type: true },
        })
  const missing = findMissingDefaults(allCategories)
  if (missing.length === 0) return categories

  await prisma.category.createMany({
    data: missing.map(({ name, type: missingType }) => ({
      userId,
      name,
      type: missingType,
      isDefault: true,
    })),
  })

  return prisma.category.findMany({
    where,
    include: { subcategories: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  })
}

export async function getCategories(type?: 'income' | 'expense') {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  return getCategoriesForUser(session.user.id, type)
}

export async function createCategoryForUser(
  userId: string,
  name: string,
  type: 'income' | 'expense'
) {
  const trimmed = categoryNameSchema.parse(name)
  categoryTypeSchema.parse(type)

  const existing = await prisma.category.findFirst({
    where: { userId, type, name: { equals: trimmed, mode: 'insensitive' } },
  })
  if (existing) return existing

  return prisma.category.create({
    data: { userId, name: trimmed, type, isDefault: false },
  })
}

export async function createCategory(name: string, type: 'income' | 'expense') {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  return createCategoryForUser(session.user.id, name, type)
}

export async function updateCategory(id: string, name: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const trimmed = categoryNameSchema.parse(name)

  await prisma.category.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  return prisma.category.update({ where: { id }, data: { name: trimmed } })
}

export async function deleteCategory(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.category.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.category.delete({ where: { id } })
}

export async function getSubcategories(categoryId: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  return prisma.subcategory.findMany({
    where: { categoryId, userId: session.user.id },
    orderBy: { name: 'asc' },
  })
}

export async function findOrCreateSubcategoryForUser(
  userId: string,
  categoryId: string,
  name: string
) {
  uuidField.parse(categoryId)
  const trimmed = requiredString.parse(name)

  await prisma.category.findFirstOrThrow({
    where: { id: categoryId, userId },
  })

  const existing = await prisma.subcategory.findFirst({
    where: {
      categoryId,
      userId,
      name: { equals: trimmed, mode: 'insensitive' },
    },
  })
  if (existing) return existing

  return prisma.subcategory.create({
    data: { categoryId, userId, name: trimmed },
  })
}

export async function findOrCreateSubcategory(
  categoryId: string,
  name: string
) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  return findOrCreateSubcategoryForUser(session.user.id, categoryId, name)
}

export async function updateSubcategory(id: string, name: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const trimmed = requiredString.parse(name)

  await prisma.subcategory.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  return prisma.subcategory.update({ where: { id }, data: { name: trimmed } })
}

export async function deleteSubcategory(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.subcategory.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  await prisma.subcategory.delete({ where: { id } })
}
