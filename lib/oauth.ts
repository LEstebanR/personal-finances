import { baseURL } from '@/lib/auth'
import { createHash, randomBytes } from 'crypto'

export { baseURL }

export const OAUTH_ACCESS_TOKEN_PREFIX = 'pfmcp_oat_'
export const OAUTH_REFRESH_TOKEN_PREFIX = 'pfmcp_rt_'
export const OAUTH_SCOPE = 'mcp'

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30
export const AUTH_CODE_TTL_SECONDS = 120

export function hashOAuthToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateOpaqueToken(prefix: string) {
  return prefix + randomBytes(32).toString('base64url')
}

export function verifyPkce(codeVerifier: string, codeChallenge: string) {
  const computed = createHash('sha256').update(codeVerifier).digest('base64url')
  return computed === codeChallenge
}
