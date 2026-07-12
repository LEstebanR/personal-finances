'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function getOverviewData() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const [accounts, transactions, transfers] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id, isArchived: false },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transfer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    accounts: accounts.map((account) => ({
      ...account,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
    })),
    transactions: transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
    transfers: transfers.map((transfer) => ({
      ...transfer,
      amount: Number(transfer.amount),
    })),
  }
}
