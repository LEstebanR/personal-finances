'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { put } from '@vercel/blob'

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

  const initialBalance = parseCurrencyInput(formData.get('initialBalance'))

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: formData.get('accountName') as string,
      type: formData.get('accountType') as string,
      initialBalance,
      currentBalance: initialBalance,
      description: (formData.get('description') as string) || null,
      color: (formData.get('color') as string) || null,
      logoUrl: (formData.get('logoUrl') as string) || null,
      icon: (formData.get('icon') as string) || null,
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

  await prisma.account.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })

  const account = await prisma.account.update({
    where: { id },
    data,
  })

  return {
    ...account,
    initialBalance: Number(account.initialBalance),
    currentBalance: Number(account.currentBalance),
  }
}
