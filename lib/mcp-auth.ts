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

export async function verifyMcpToken(
  _req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined

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
