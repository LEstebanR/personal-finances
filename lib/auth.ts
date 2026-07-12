import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

import { prisma } from './prisma'

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export const auth = betterAuth({
  baseURL,
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  account: {
    modelName: 'authAccount',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
})
