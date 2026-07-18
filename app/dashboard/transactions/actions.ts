'use server'

import { parseCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import {
  optionalString,
  positiveAmount,
  uuidField,
  validDate,
} from '@/lib/validation'
import { z } from 'zod'

const transactionSchema = z
  .object({
    accountId: uuidField.nullable(),
    debtId: uuidField.nullable(),
    amount: positiveAmount,
    type: z.enum(['income', 'expense']),
    categoryId: uuidField,
    subcategoryId: uuidField.nullable(),
    description: z.string(),
    date: validDate,
  })
  .refine((data) => data.accountId || data.debtId, {
    message: 'An account or debt is required',
    path: ['accountId'],
  })
  .refine((data) => !data.debtId || data.type === 'expense', {
    message: 'Only expenses can be charged to a debt',
    path: ['debtId'],
  })

const transferSchema = z
  .object({
    fromAccountId: uuidField,
    toAccountId: uuidField,
    amount: positiveAmount,
    date: validDate,
    note: optionalString,
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  })

export async function getTransactions() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { category: true, subcategory: true, account: true, debt: true },
    orderBy: { createdAt: 'desc' },
  })

  return transactions.map(
    ({ category, subcategory, account, debt, ...transaction }) => ({
      ...transaction,
      amount: Number(transaction.amount),
      categoryName: category.name,
      subcategoryName: subcategory?.name ?? null,
      sourceName: account?.name ?? debt?.name ?? null,
      isDebtSource: !!debt,
    })
  )
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

  const {
    accountId,
    debtId,
    amount,
    type,
    categoryId,
    subcategoryId,
    description,
    date,
  } = transactionSchema.parse({
    accountId: (formData.get('accountId') as string) || null,
    debtId: (formData.get('debtId') as string) || null,
    amount: parseCurrencyInput(formData.get('amount')),
    type: formData.get('type'),
    categoryId: formData.get('categoryId'),
    subcategoryId: (formData.get('subcategoryId') as string) || null,
    description: formData.get('description'),
    date: new Date(formData.get('date') as string),
  })

  const transaction = await prisma.$transaction(async (tx) => {
    await tx.category.findFirstOrThrow({
      where: { id: categoryId, userId: session.user.id },
    })

    if (accountId) {
      await tx.account.findFirstOrThrow({
        where: { id: accountId, userId: session.user.id },
      })
      const balanceChange = type === 'income' ? amount : -amount
      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: balanceChange } },
      })
    } else if (debtId) {
      await tx.debt.findFirstOrThrow({
        where: { id: debtId, userId: session.user.id, type: 'credit_card' },
      })
      await tx.debt.update({
        where: { id: debtId },
        data: { remainingBalance: { increment: amount } },
      })
    }

    return tx.transaction.create({
      data: {
        userId: session.user.id,
        accountId,
        debtId,
        amount,
        type,
        description,
        date,
        categoryId,
        subcategoryId,
      },
    })
  })

  return { ...transaction, amount: Number(transaction.amount) }
}

export async function updateTransaction(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const {
    accountId,
    debtId,
    amount,
    type,
    categoryId,
    subcategoryId,
    description,
    date,
  } = transactionSchema.parse({
    accountId: (formData.get('accountId') as string) || null,
    debtId: (formData.get('debtId') as string) || null,
    amount: parseCurrencyInput(formData.get('amount')),
    type: formData.get('type'),
    categoryId: formData.get('categoryId'),
    subcategoryId: (formData.get('subcategoryId') as string) || null,
    description: formData.get('description'),
    date: new Date(formData.get('date') as string),
  })

  const transaction = await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })
    await tx.category.findFirstOrThrow({
      where: { id: categoryId, userId: session.user.id },
    })

    if (existing.accountId) {
      const oldChange =
        existing.type === 'income'
          ? -Number(existing.amount)
          : Number(existing.amount)
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: oldChange } },
      })
    } else if (existing.debtId) {
      await tx.debt.update({
        where: { id: existing.debtId },
        data: { remainingBalance: { decrement: Number(existing.amount) } },
      })
    }

    if (accountId) {
      await tx.account.findFirstOrThrow({
        where: { id: accountId, userId: session.user.id },
      })
      const newChange = type === 'income' ? amount : -amount
      await tx.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: newChange } },
      })
    } else if (debtId) {
      await tx.debt.findFirstOrThrow({
        where: { id: debtId, userId: session.user.id, type: 'credit_card' },
      })
      await tx.debt.update({
        where: { id: debtId },
        data: { remainingBalance: { increment: amount } },
      })
    }

    return tx.transaction.update({
      where: { id },
      data: {
        accountId,
        debtId,
        amount,
        type,
        description,
        date,
        categoryId,
        subcategoryId,
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

    if (existing.accountId) {
      const reversal =
        existing.type === 'income'
          ? -Number(existing.amount)
          : Number(existing.amount)
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: reversal } },
      })
    } else if (existing.debtId) {
      await tx.debt.update({
        where: { id: existing.debtId },
        data: { remainingBalance: { decrement: Number(existing.amount) } },
      })
    }

    await tx.transaction.delete({ where: { id } })
  })
}

export async function createTransfer(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { fromAccountId, toAccountId, amount, date, note } =
    transferSchema.parse({
      fromAccountId: formData.get('fromAccountId'),
      toAccountId: formData.get('toAccountId'),
      amount: parseCurrencyInput(formData.get('amount')),
      date: new Date(formData.get('date') as string),
      note: formData.get('description'),
    })

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
        date,
        note,
      },
    })
  })

  return { ...transfer, amount: Number(transfer.amount) }
}

export async function updateTransfer(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const { fromAccountId, toAccountId, amount, date, note } =
    transferSchema.parse({
      fromAccountId: formData.get('fromAccountId'),
      toAccountId: formData.get('toAccountId'),
      amount: parseCurrencyInput(formData.get('amount')),
      date: new Date(formData.get('date') as string),
      note: formData.get('description'),
    })

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
        date,
        note,
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
