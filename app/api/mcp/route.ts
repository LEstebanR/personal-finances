import { getAccountsForUser } from '@/app/dashboard/accounts/actions'
import { getBudgetOverviewForUser } from '@/app/dashboard/budgets/actions'
import { getCategoriesForUser } from '@/app/dashboard/categories/actions'
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
import type { ServerContext } from '@modelcontextprotocol/server'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { z } from 'zod'

function requireUserId(ctx: ServerContext) {
  const userId = ctx.http?.authInfo?.extra?.userId
  if (typeof userId !== 'string') throw new Error('Not authenticated')
  return userId
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_accounts',
      {
        title: 'List accounts',
        description: 'List the cash/bank accounts and their current balances.',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const accounts = await getAccountsForUser(requireUserId(ctx))
        return { content: [{ type: 'text', text: JSON.stringify(accounts) }] }
      }
    )

    server.registerTool(
      'get_overview',
      {
        title: 'Get financial overview',
        description:
          'Get a snapshot: accounts, recent transactions/transfers, and total debt.',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const overview = await getOverviewDataForUser(requireUserId(ctx))
        return { content: [{ type: 'text', text: JSON.stringify(overview) }] }
      }
    )

    server.registerTool(
      'list_transactions',
      {
        title: 'List transactions',
        description:
          'List income/expense transactions, optionally filtered by year, month, and/or account.',
        inputSchema: z.object({
          year: z.number().int().optional(),
          month: z.number().int().min(1).max(12).optional(),
          accountId: z.string().uuid().optional(),
        }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const transactions = await getTransactionsForUser(
          requireUserId(ctx),
          args
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(transactions) }],
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
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const transfers = await getTransfersForUser(requireUserId(ctx), args)
        return { content: [{ type: 'text', text: JSON.stringify(transfers) }] }
      }
    )

    server.registerTool(
      'list_subscriptions',
      {
        title: 'List subscriptions',
        description:
          'List recurring subscriptions (name, amount, frequency, due date, active/cancelled status).',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const subscriptions = await getSubscriptionsForUser(requireUserId(ctx))
        return {
          content: [{ type: 'text', text: JSON.stringify(subscriptions) }],
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
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const debts = await getDebtsForUser(requireUserId(ctx))
        return { content: [{ type: 'text', text: JSON.stringify(debts) }] }
      }
    )

    server.registerTool(
      'list_categories',
      {
        title: 'List categories',
        description:
          'List income/expense categories and subcategories, with their IDs — use this to resolve categoryId/subcategoryId before calling create_transaction.',
        inputSchema: z.object({
          type: z.enum(['income', 'expense']).optional(),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ type }, ctx) => {
        const categories = await getCategoriesForUser(requireUserId(ctx), type)
        return { content: [{ type: 'text', text: JSON.stringify(categories) }] }
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
        annotations: { readOnlyHint: true },
      },
      async ({ year, month }, ctx) => {
        const overview = await getBudgetOverviewForUser(
          requireUserId(ctx),
          month,
          year
        )
        return { content: [{ type: 'text', text: JSON.stringify(overview) }] }
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
        annotations: { readOnlyHint: true },
      },
      async ({ year, month }, ctx) => {
        const report = await getMonthlyFinancialReportForUser(
          requireUserId(ctx),
          year,
          month
        )
        return { content: [{ type: 'text', text: report }] }
      }
    )

    server.registerTool(
      'create_transaction',
      {
        title: 'Create transaction',
        description:
          'Record an income or expense transaction against an account or debt. This moves real money in the app — confirm the amount, account, and category with the user before calling.',
        inputSchema: z.object({
          accountId: z.string().uuid().nullable(),
          debtId: z.string().uuid().nullable(),
          amount: z.number().positive(),
          type: z.enum(['income', 'expense']),
          categoryId: z.string().uuid(),
          subcategoryId: z.string().uuid().nullable(),
          description: z.string(),
          date: z.string(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true },
      },
      async (args, ctx) => {
        const parsed = transactionSchema.parse({
          ...args,
          date: new Date(args.date),
        })
        const transaction = await createTransactionForUser(
          requireUserId(ctx),
          parsed
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(transaction) }],
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
        annotations: { readOnlyHint: false, destructiveHint: true },
      },
      async (args, ctx) => {
        const parsed = transferSchema.parse({
          ...args,
          date: new Date(args.date),
        })
        const transfer = await createTransferForUser(requireUserId(ctx), parsed)
        return { content: [{ type: 'text', text: JSON.stringify(transfer) }] }
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
