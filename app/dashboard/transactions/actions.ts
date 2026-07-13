'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function getTransactions() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount),
  }))
}

export async function getTransfers() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const transfers = await prisma.transfer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return transfers.map((transfer) => ({
    ...transfer,
    amount: Number(transfer.amount),
  }))
}

export async function createTransaction(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const accountId = formData.get('accountId') as string
  const amount = parseCurrencyInput(formData.get('amount'))
  const type = formData.get('type') as string
  const balanceChange = type === 'income' ? amount : -amount

  const transaction = await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirstOrThrow({
      where: { id: accountId, userId: session.user.id },
    })
    if (account.userId !== session.user.id) {
      throw new Error('Not authorized')
    }

    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { increment: balanceChange } },
    })

    return tx.transaction.create({
      data: {
        userId: session.user.id,
        accountId,
        amount,
        type,
        description: formData.get('description') as string,
        date: new Date(formData.get('date') as string),
        category: (formData.get('category') as string) || null,
      },
    })
  })

  return { ...transaction, amount: Number(transaction.amount) }
}

export async function updateTransaction(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const accountId = formData.get('accountId') as string
  const amount = parseCurrencyInput(formData.get('amount'))
  const type = formData.get('type') as string

  const transaction = await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })

    const oldChange =
      existing.type === 'income'
        ? -Number(existing.amount)
        : Number(existing.amount)
    const newChange = type === 'income' ? amount : -amount

    if (existing.accountId === accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: oldChange + newChange } },
      })
    } else {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: oldChange } },
      })
      await tx.account.findFirstOrThrow({
        where: { id: accountId, userId: session.user.id },
      })
      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: newChange } },
      })
    }

    return tx.transaction.update({
      where: { id },
      data: {
        accountId,
        amount,
        type,
        description: formData.get('description') as string,
        date: new Date(formData.get('date') as string),
        category: (formData.get('category') as string) || null,
      },
    })
  })

  return { ...transaction, amount: Number(transaction.amount) }
}

export async function deleteTransaction(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })

    const reversal =
      existing.type === 'income'
        ? -Number(existing.amount)
        : Number(existing.amount)

    await tx.account.update({
      where: { id: existing.accountId },
      data: { currentBalance: { increment: reversal } },
    })

    await tx.transaction.delete({ where: { id } })
  })
}

export async function createTransfer(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const fromAccountId = formData.get('fromAccountId') as string
  const toAccountId = formData.get('toAccountId') as string
  const amount = parseCurrencyInput(formData.get('amount'))

  const transfer = await prisma.$transaction(async (tx) => {
    const [fromAccount, toAccount] = await Promise.all([
      tx.account.findFirstOrThrow({
        where: { id: fromAccountId, userId: session.user.id },
      }),
      tx.account.findFirstOrThrow({
        where: { id: toAccountId, userId: session.user.id },
      }),
    ])
    if (
      fromAccount.userId !== session.user.id ||
      toAccount.userId !== session.user.id
    ) {
      throw new Error('Not authorized')
    }

    await tx.account.update({
      where: { id: fromAccountId },
      data: { currentBalance: { decrement: amount } },
    })
    await tx.account.update({
      where: { id: toAccountId },
      data: { currentBalance: { increment: amount } },
    })

    return tx.transfer.create({
      data: {
        userId: session.user.id,
        fromAccountId,
        toAccountId,
        amount,
        date: new Date(formData.get('date') as string),
        note: (formData.get('description') as string) || null,
      },
    })
  })

  return { ...transfer, amount: Number(transfer.amount) }
}

export async function updateTransfer(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const fromAccountId = formData.get('fromAccountId') as string
  const toAccountId = formData.get('toAccountId') as string
  const amount = parseCurrencyInput(formData.get('amount'))

  const transfer = await prisma.$transaction(async (tx) => {
    const existing = await tx.transfer.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })

    // Reverse the original transfer
    await tx.account.update({
      where: { id: existing.fromAccountId },
      data: { currentBalance: { increment: Number(existing.amount) } },
    })
    await tx.account.update({
      where: { id: existing.toAccountId },
      data: { currentBalance: { decrement: Number(existing.amount) } },
    })

    await tx.account.findFirstOrThrow({
      where: { id: fromAccountId, userId: session.user.id },
    })
    await tx.account.findFirstOrThrow({
      where: { id: toAccountId, userId: session.user.id },
    })

    // Apply the updated transfer
    await tx.account.update({
      where: { id: fromAccountId },
      data: { currentBalance: { decrement: amount } },
    })
    await tx.account.update({
      where: { id: toAccountId },
      data: { currentBalance: { increment: amount } },
    })

    return tx.transfer.update({
      where: { id },
      data: {
        fromAccountId,
        toAccountId,
        amount,
        date: new Date(formData.get('date') as string),
        note: (formData.get('description') as string) || null,
      },
    })
  })

  return { ...transfer, amount: Number(transfer.amount) }
}

export async function deleteTransfer(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.$transaction(async (tx) => {
    const existing = await tx.transfer.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })

    await tx.account.update({
      where: { id: existing.fromAccountId },
      data: { currentBalance: { increment: Number(existing.amount) } },
    })
    await tx.account.update({
      where: { id: existing.toAccountId },
      data: { currentBalance: { decrement: Number(existing.amount) } },
    })

    await tx.transfer.delete({ where: { id } })
  })
}
