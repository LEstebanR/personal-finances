import { OAUTH_ACCESS_TOKEN_PREFIX, hashOAuthToken } from '@/lib/oauth'
import { prisma } from '@/lib/prisma'
import type { AuthInfo } from '@modelcontextprotocol/server'
import { createHash, randomBytes } from 'crypto'

const TOKEN_PREFIX = 'pfmcp_'

export function hashMcpToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateMcpToken() {
  return TOKEN_PREFIX + randomBytes(32).toString('base64url')
}

async function verifyOAuthAccessToken(
  bearerToken: string
): Promise<AuthInfo | undefined> {
  const found = await prisma.oAuthAccessToken.findUnique({
    where: { accessTokenHash: hashOAuthToken(bearerToken) },
  })

  if (!found || found.revokedAt || found.accessTokenExpiresAt < new Date()) {
    return undefined
  }

  return {
    token: bearerToken,
    clientId: found.clientId,
    scopes: [found.scope],
    expiresAt: Math.floor(found.accessTokenExpiresAt.getTime() / 1000),
    extra: { userId: found.userId },
  }
}

export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined

  if (bearerToken.startsWith(OAUTH_ACCESS_TOKEN_PREFIX)) {
    return verifyOAuthAccessToken(bearerToken)
  }

  const apiKey = await prisma.mcpApiKey.findUnique({
    where: { keyHash: hashMcpToken(bearerToken) },
  })

  if (!apiKey || apiKey.revokedAt) return undefined

  await prisma.mcpApiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    token: bearerToken,
    clientId: apiKey.id,
    scopes: [],
    extra: { userId: apiKey.userId },
  }
}
