'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function getProfile() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const [user, totalTransactions, totalAccounts] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.transaction.count({ where: { userId: session.user.id } }),
    prisma.account.count({ where: { userId: session.user.id } }),
  ])

  return {
    name: user.name,
    email: user.email,
    image: user.image,
    currency: user.currency,
    timezone: user.timezone,
    budgetPeriod: user.budgetPeriod,
    memberSince: user.createdAt,
    totalTransactions,
    totalAccounts,
  }
}

export async function updateProfile(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: formData.get('name') as string,
      currency: formData.get('currency') as string,
      timezone: formData.get('timezone') as string,
      budgetPeriod: formData.get('budgetPeriod') as string,
    },
  })

  return { name: user.name }
}
