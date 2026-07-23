'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function getOverviewData() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const [accounts, transactions, transfers, debts] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id, isArchived: false },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: { category: true, account: true, debt: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.transfer.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.debt.findMany({
      where: { userId: session.user.id },
    }),
  ])

  return {
    accounts: accounts.map((account) => ({
      ...account,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
    })),
    transactions: transactions.map(
      ({ category, account, debt, ...transaction }) => ({
        ...transaction,
        amount: Number(transaction.amount),
        categoryName: category.name,
        sourceName: account?.name ?? debt?.name ?? null,
      })
    ),
    transfers: transfers.map((transfer) => ({
      ...transfer,
      amount: Number(transfer.amount),
    })),
    totalDebt: debts.reduce(
      (total, debt) => total + Number(debt.remainingBalance),
      0
    ),
    totalMinimumPayment: debts
      .filter((debt) => Number(debt.remainingBalance) > 0)
      .reduce((total, debt) => total + Number(debt.minimumPayment ?? 0), 0),
  }
}
