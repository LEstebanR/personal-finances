'use server'

import { parseCurrencyInput, parseOptionalCurrencyInput } from '@/lib/currency'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function getDebts() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const debts = await prisma.debt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return debts.map((debt) => ({
    ...debt,
    originalAmount: Number(debt.originalAmount),
    remainingBalance: Number(debt.remainingBalance),
    minimumPayment:
      debt.minimumPayment === null ? null : Number(debt.minimumPayment),
    creditLimit: debt.creditLimit === null ? null : Number(debt.creditLimit),
  }))
}

export async function getDebtPayments(debtId: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const payments = await prisma.debtPayment.findMany({
    where: { debtId, userId: session.user.id },
    orderBy: { date: 'desc' },
  })

  return payments.map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
  }))
}

function parsePaymentDueDay(value: FormDataEntryValue | null): number | null {
  if (!String(value ?? '').trim()) return null
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? null : Math.min(31, Math.max(1, parsed))
}

export async function createDebt(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const type = (formData.get('type') as string) || 'loan'
  const originalAmount = parseCurrencyInput(formData.get('originalAmount'))
  const minimumPayment = parseOptionalCurrencyInput(
    formData.get('minimumPayment')
  )
  const paymentDueDay = parsePaymentDueDay(formData.get('paymentDueDay'))
  const creditLimit =
    type === 'credit_card'
      ? parseOptionalCurrencyInput(formData.get('creditLimit'))
      : null

  const debt = await prisma.debt.create({
    data: {
      userId: session.user.id,
      name: formData.get('name') as string,
      type,
      originalAmount,
      remainingBalance: originalAmount,
      minimumPayment,
      paymentDueDay,
      creditLimit,
    },
  })

  return {
    ...debt,
    originalAmount: Number(debt.originalAmount),
    remainingBalance: Number(debt.remainingBalance),
    minimumPayment:
      debt.minimumPayment === null ? null : Number(debt.minimumPayment),
    creditLimit: debt.creditLimit === null ? null : Number(debt.creditLimit),
  }
}

export async function updateDebt(id: string, formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const minimumPayment = parseOptionalCurrencyInput(
    formData.get('minimumPayment')
  )
  const paymentDueDay = parsePaymentDueDay(formData.get('paymentDueDay'))

  const existing = await prisma.debt.findFirstOrThrow({
    where: { id, userId: session.user.id },
  })
  const creditLimit =
    existing.type === 'credit_card'
      ? parseOptionalCurrencyInput(formData.get('creditLimit'))
      : null

  const debt = await prisma.$transaction(async (tx) => {
    const updated = await tx.debt.update({
      where: { id, userId: session.user.id },
      data: {
        name: formData.get('name') as string,
        minimumPayment,
        paymentDueDay,
        creditLimit,
      },
    })

    // Not-yet-arrived planned items were generated from the old minimum
    // payment/due day; drop them so they regenerate with the updated
    // details next time that month is viewed. Past/current entries stay as
    // the historical record of what was actually planned.
    await tx.budgetItem.deleteMany({
      where: { debtId: id, date: { gt: new Date() } },
    })

    return updated
  })

  return {
    ...debt,
    originalAmount: Number(debt.originalAmount),
    remainingBalance: Number(debt.remainingBalance),
    minimumPayment:
      debt.minimumPayment === null ? null : Number(debt.minimumPayment),
    creditLimit: debt.creditLimit === null ? null : Number(debt.creditLimit),
  }
}

export async function deleteDebt(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.$transaction(async (tx) => {
    await tx.debt.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })
    await tx.debt.delete({ where: { id } })
  })
}

export async function createDebtPayment(formData: FormData) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const debtId = formData.get('debtId') as string
  const accountId = formData.get('accountId') as string
  const amount = parseCurrencyInput(formData.get('amount'))

  const payment = await prisma.$transaction(async (tx) => {
    const [debt, account] = await Promise.all([
      tx.debt.findFirstOrThrow({
        where: { id: debtId, userId: session.user.id },
      }),
      tx.account.findFirstOrThrow({
        where: { id: accountId, userId: session.user.id },
      }),
    ])
    if (debt.userId !== session.user.id || account.userId !== session.user.id) {
      throw new Error('Not authorized')
    }

    await tx.account.update({
      where: { id: accountId },
      data: { currentBalance: { decrement: amount } },
    })
    await tx.debt.update({
      where: { id: debtId },
      data: { remainingBalance: { decrement: amount } },
    })

    return tx.debtPayment.create({
      data: {
        debtId,
        accountId,
        userId: session.user.id,
        amount,
        date: new Date(formData.get('date') as string),
        note: (formData.get('note') as string) || null,
      },
    })
  })

  return { ...payment, amount: Number(payment.amount) }
}

export async function deleteDebtPayment(id: string) {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  await prisma.$transaction(async (tx) => {
    const existing = await tx.debtPayment.findFirstOrThrow({
      where: { id, userId: session.user.id },
    })

    await tx.account.update({
      where: { id: existing.accountId },
      data: { currentBalance: { increment: Number(existing.amount) } },
    })
    await tx.debt.update({
      where: { id: existing.debtId },
      data: { remainingBalance: { increment: Number(existing.amount) } },
    })

    await tx.debtPayment.delete({ where: { id } })
  })
}
