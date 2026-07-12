'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

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

  const initialBalance = parseFloat(formData.get('initialBalance') as string)

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: formData.get('accountName') as string,
      type: formData.get('accountType') as string,
      initialBalance,
      currentBalance: initialBalance,
      description: (formData.get('description') as string) || null,
    },
  })

  return {
    ...account,
    initialBalance: Number(account.initialBalance),
    currentBalance: Number(account.currentBalance),
  }
}
