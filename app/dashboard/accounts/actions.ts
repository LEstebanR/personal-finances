'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { finiteAmount, optionalString, requiredString } from '@/lib/validation'
import { put } from '@vercel/blob'
import { z } from 'zod'

const accountTypeSchema = z.enum(['cash', 'savings', 'caja'])

const createAccountSchema = z.object({
  accountName: requiredString,
  accountType: accountTypeSchema,
  initialBalance: finiteAmount,
  description: optionalString,
  color: optionalString,
  logoUrl: optionalString,
  icon: optionalString,
})

const updateAccountSchema = z.object({
  name: requiredString,
  type: accountTypeSchema,
  description: z.string().nullable(),
  color: z.string().nullable(),
  logoUrl: z.string().nullable(),
  icon: z.string().nullable(),
})

export async function getAccounts() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return accounts.map((account) => ({
    ...account,
    initialBalance: Number(account.initialBalance),
    currentBalance: Number(account.currentBalance),
  }))
}

export async function createAccount(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const {
    accountName,
    accountType,
    initialBalance,
    description,
    color,
    logoUrl,
    icon,
  } = createAccountSchema.parse({
    accountName: formData.get('accountName'),
    accountType: formData.get('accountType'),
    initialBalance: parseCurrencyInput(formData.get('initialBalance')),
    description: formData.get('description'),
    color: formData.get('color'),
    logoUrl: formData.get('logoUrl'),
    icon: formData.get('icon'),
  })

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: accountName,
      type: accountType,
      initialBalance,
      currentBalance: initialBalance,
      description,
      color,
      logoUrl,
      icon,
    },
  })

  return {
    ...account,
    initialBalance: Number(account.initialBalance),
    currentBalance: Number(account.currentBalance),
  }
}

// Uploaded logos are stored publicly (not namespaced per user) so the same
// blob URL can be reused across accounts/users like the suggested bank
// logos from the public logo API.
export async function uploadAccountLogo(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) throw new Error('No file provided')

  const blob = await put(`account-logos/${file.name}`, file, {
    access: 'public',
  })

  return blob.url
}

export async function updateAccount(
  id: string,
  data: {
    name: string
    type: string
    description: string | null
    color: string | null
    logoUrl: string | null
    icon: string | null
  }
) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const validated = updateAccountSchema.parse(data)

  await prisma.account.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  const account = await prisma.account.update({
    where: { id },
    data: validated,
  })

  return {
    ...account,
    initialBalance: Number(account.initialBalance),
    currentBalance: Number(account.currentBalance),
  }
}
