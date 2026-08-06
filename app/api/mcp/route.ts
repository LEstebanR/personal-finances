import { getAccountsForUser } from '@/app/dashboard/accounts/actions'
import { getBudgetOverviewForUser } from '@/app/dashboard/budgets/actions'
import {
  createCategoryForUser,
  findOrCreateSubcategoryForUser,
  getCategoriesForUser,
} from '@/app/dashboard/categories/actions'
import { getDebtsForUser } from '@/app/dashboard/debts/actions'
import { getOverviewDataForUser } from '@/app/dashboard/overview/actions'
import { getMonthlyFinancialReportForUser } from '@/app/dashboard/spending-trends/actions'
import { getSubscriptionsForUser } from '@/app/dashboard/subscriptions/actions'
import {
  createTransactionForUser,
  createTransferForUser,
  getTransactionsForUser,
  getTransfersForUser,
} from '@/app/dashboard/transactions/actions'
import {
  transactionSchema,
  transferSchema,
} from '@/app/dashboard/transactions/schemas'
import { verifyMcpToken } from '@/lib/mcp-auth'
import { prisma } from '@/lib/prisma'
import type { ServerContext } from '@modelcontextprotocol/server'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { ZodError, z } from 'zod'

const RECENT_TRANSACTIONS_LIMIT = 50

const anyRecord = z.record(z.string(), z.unknown())

function requireUserId(ctx: ServerContext) {
  const userId = ctx.http?.authInfo?.extra?.userId
  if (typeof userId !== 'string') throw new Error('Not authenticated')
  return userId
}

function formatZodError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
  }
  return error instanceof Error ? error.message : String(error)
}

async function enrichTransaction(transaction: {
  categoryId: string
  subcategoryId: string | null
  accountId: string | null
  debtId: string | null
  [key: string]: unknown
}) {
  const [category, subcategory, account, debt] = await Promise.all([
    prisma.category.findUnique({ where: { id: transaction.categoryId } }),
    transaction.subcategoryId
      ? prisma.subcategory.findUnique({
          where: { id: transaction.subcategoryId },
        })
      : null,
    transaction.accountId
      ? prisma.account.findUnique({ where: { id: transaction.accountId } })
      : null,
    transaction.debtId
      ? prisma.debt.findUnique({ where: { id: transaction.debtId } })
      : null,
  ])

  return {
    ...transaction,
    categoryName: category?.name ?? null,
    subcategoryName: subcategory?.name ?? null,
    accountName: account?.name ?? null,
    debtName: debt?.name ?? null,
  }
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'get_current_date',
      {
        title: 'Get current date',
        description:
          "Get today's date, timezone, and currency for this user. Call this before using tools that take a year/month instead of guessing today's date.",
        inputSchema: z.object({}),
        outputSchema: z.object({
          date: z.string(),
          timezone: z.string(),
          currency: z.string(),
        }),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: requireUserId(ctx) },
          select: { timezone: true, currency: true },
        })
        const date = new Intl.DateTimeFormat('en-CA', {
          timeZone: user.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date())
        const structuredContent = {
          date,
          timezone: user.timezone,
          currency: user.currency,
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'list_accounts',
      {
        title: 'List accounts',
        description: 'List the cash/bank accounts and their current balances.',
        inputSchema: z.object({}),
        outputSchema: z.object({ accounts: z.array(anyRecord) }),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const accounts = await getAccountsForUser(requireUserId(ctx))
        const structuredContent = { accounts }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'get_overview',
      {
        title: 'Get financial overview',
        description:
          'Get a snapshot: accounts, recent transactions/transfers, and total debt.',
        inputSchema: z.object({}),
        outputSchema: anyRecord,
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const overview = await getOverviewDataForUser(requireUserId(ctx))
        return {
          content: [{ type: 'text', text: JSON.stringify(overview) }],
          structuredContent: overview,
        }
      }
    )

    server.registerTool(
      'list_transactions',
      {
        title: 'List transactions',
        description: `List income/expense transactions, optionally filtered by year, month, and/or account. Without a year filter, returns only the ${RECENT_TRANSACTIONS_LIMIT} most recently added — check totalCount/truncated in the response and pass a year to see the rest.`,
        inputSchema: z.object({
          year: z.number().int().optional(),
          month: z.number().int().min(1).max(12).optional(),
          accountId: z.string().uuid().optional(),
        }),
        outputSchema: z.object({
          transactions: z.array(anyRecord),
          totalCount: z.number(),
          truncated: z.boolean(),
        }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const all = await getTransactionsForUser(requireUserId(ctx), args)
        const truncated = !args.year && all.length > RECENT_TRANSACTIONS_LIMIT
        const structuredContent = {
          transactions: truncated
            ? all.slice(0, RECENT_TRANSACTIONS_LIMIT)
            : all,
          totalCount: all.length,
          truncated,
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'list_transfers',
      {
        title: 'List transfers',
        description:
          'List transfers between accounts, optionally filtered by year and month.',
        inputSchema: z.object({
          year: z.number().int().optional(),
          month: z.number().int().min(1).max(12).optional(),
        }),
        outputSchema: z.object({ transfers: z.array(anyRecord) }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const transfers = await getTransfersForUser(requireUserId(ctx), args)
        const structuredContent = { transfers }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'list_subscriptions',
      {
        title: 'List subscriptions',
        description:
          'List recurring subscriptions (name, amount, frequency, due date, active/cancelled status).',
        inputSchema: z.object({}),
        outputSchema: z.object({ subscriptions: z.array(anyRecord) }),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const subscriptions = await getSubscriptionsForUser(requireUserId(ctx))
        const structuredContent = { subscriptions }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'list_debts',
      {
        title: 'List debts',
        description:
          'List loans and credit cards (balance, interest, minimum payment, due day, total paid).',
        inputSchema: z.object({}),
        outputSchema: z.object({ debts: z.array(anyRecord) }),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const debts = await getDebtsForUser(requireUserId(ctx))
        const structuredContent = { debts }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'list_categories',
      {
        title: 'List categories',
        description:
          'List income/expense categories and subcategories, with their IDs. You can also just pass categoryName/subcategoryName directly to create_transaction instead of looking up IDs here first.',
        inputSchema: z.object({
          type: z.enum(['income', 'expense']).optional(),
        }),
        outputSchema: z.object({ categories: z.array(anyRecord) }),
        annotations: { readOnlyHint: true },
      },
      async ({ type }, ctx) => {
        const categories = await getCategoriesForUser(requireUserId(ctx), type)
        const structuredContent = { categories }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'get_budget_overview',
      {
        title: 'Get budget overview',
        description:
          'Get budgeted vs. actual spending per expense category for a given month.',
        inputSchema: z.object({
          year: z.number().int(),
          month: z.number().int().min(1).max(12),
        }),
        outputSchema: z.object({ budget: z.array(anyRecord) }),
        annotations: { readOnlyHint: true },
      },
      async ({ year, month }, ctx) => {
        const budget = await getBudgetOverviewForUser(
          requireUserId(ctx),
          month,
          year
        )
        const structuredContent = { budget }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'get_monthly_report',
      {
        title: 'Get monthly financial report',
        description:
          'Get a Markdown financial report (balances, debts, income/expenses, movements) for a given month.',
        inputSchema: z.object({
          year: z.number().int(),
          month: z.number().int().min(1).max(12),
        }),
        outputSchema: z.object({ report: z.string() }),
        annotations: { readOnlyHint: true },
      },
      async ({ year, month }, ctx) => {
        const report = await getMonthlyFinancialReportForUser(
          requireUserId(ctx),
          year,
          month
        )
        const structuredContent = { report }
        return {
          content: [{ type: 'text', text: report }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'create_transaction',
      {
        title: 'Create transaction',
        description:
          'Record an income or expense transaction against an account or debt. This moves real money in the app — confirm the amount, account, and category with the user before calling. Pass either categoryId or categoryName (a new category is created if the name doesn’t exist yet); same for subcategoryId/subcategoryName.',
        inputSchema: z.object({
          accountId: z.string().uuid().nullable(),
          debtId: z.string().uuid().nullable(),
          amount: z.number().positive(),
          type: z.enum(['income', 'expense']),
          categoryId: z.string().uuid().nullish(),
          categoryName: z.string().nullish(),
          subcategoryId: z.string().uuid().nullish(),
          subcategoryName: z.string().nullish(),
          description: z.string(),
          date: z.string(),
        }),
        outputSchema: anyRecord,
        annotations: { readOnlyHint: false, destructiveHint: true },
      },
      async (args, ctx) => {
        const userId = requireUserId(ctx)

        if (!args.categoryId && !args.categoryName) {
          throw new Error('Provide either categoryId or categoryName')
        }
        const categoryId = args.categoryId
          ? args.categoryId
          : (await createCategoryForUser(userId, args.categoryName!, args.type))
              .id

        let subcategoryId: string | null = args.subcategoryId ?? null
        if (!subcategoryId && args.subcategoryName) {
          subcategoryId = (
            await findOrCreateSubcategoryForUser(
              userId,
              categoryId,
              args.subcategoryName
            )
          ).id
        }

        let parsed
        try {
          parsed = transactionSchema.parse({
            accountId: args.accountId,
            debtId: args.debtId,
            amount: args.amount,
            type: args.type,
            categoryId,
            subcategoryId,
            description: args.description,
            date: new Date(args.date),
          })
        } catch (error) {
          throw new Error(formatZodError(error))
        }

        const transaction = await createTransactionForUser(userId, parsed)
        const structuredContent = await enrichTransaction(transaction)
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )

    server.registerTool(
      'create_transfer',
      {
        title: 'Create transfer',
        description:
          'Move money from one account to another. This moves real money in the app — confirm the amount and both accounts with the user before calling.',
        inputSchema: z.object({
          fromAccountId: z.string().uuid(),
          toAccountId: z.string().uuid(),
          amount: z.number().positive(),
          date: z.string(),
          note: z.string().optional(),
        }),
        outputSchema: anyRecord,
        annotations: { readOnlyHint: false, destructiveHint: true },
      },
      async (args, ctx) => {
        let parsed
        try {
          parsed = transferSchema.parse({
            ...args,
            date: new Date(args.date),
          })
        } catch (error) {
          throw new Error(formatZodError(error))
        }

        const transfer = await createTransferForUser(requireUserId(ctx), parsed)
        const [fromAccount, toAccount] = await Promise.all([
          prisma.account.findUnique({ where: { id: transfer.fromAccountId } }),
          prisma.account.findUnique({ where: { id: transfer.toAccountId } }),
        ])
        const structuredContent = {
          ...transfer,
          fromAccountName: fromAccount?.name ?? null,
          toAccountName: toAccount?.name ?? null,
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
          structuredContent,
        }
      }
    )
  },
  { serverInfo: { name: 'personal-finances', version: '0.1.0' } }
)

const authHandler = withMcpAuth(handler, verifyMcpToken, {
  required: true,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
})

export { authHandler as GET, authHandler as POST }
