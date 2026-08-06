import {
  ACCESS_TOKEN_TTL_SECONDS,
  OAUTH_ACCESS_TOKEN_PREFIX,
  OAUTH_REFRESH_TOKEN_PREFIX,
  OAUTH_SCOPE,
  REFRESH_TOKEN_TTL_SECONDS,
  generateOpaqueToken,
  hashOAuthToken,
  verifyPkce,
} from '@/lib/oauth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const responseHeaders = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

function errorResponse(error: string, description?: string) {
  return NextResponse.json(
    { error, ...(description ? { error_description: description } : {}) },
    { status: 400, headers: responseHeaders }
  )
}

function issueTokenResponse(accessToken: string, refreshToken: string) {
  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: OAUTH_SCOPE,
    },
    { headers: responseHeaders }
  )
}

async function handleAuthorizationCode(params: URLSearchParams) {
  const code = params.get('code')
  const redirectUri = params.get('redirect_uri')
  const clientId = params.get('client_id')
  const codeVerifier = params.get('code_verifier')

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return errorResponse('invalid_request')
  }

  const found = await prisma.oAuthAuthorizationCode.findUnique({
    where: { codeHash: hashOAuthToken(code) },
  })
  if (!found || found.expiresAt < new Date()) {
    return errorResponse('invalid_grant')
  }

  const consumed = await prisma.oAuthAuthorizationCode.updateMany({
    where: { id: found.id, consumedAt: null },
    data: { consumedAt: new Date() },
  })
  if (consumed.count !== 1) {
    return errorResponse('invalid_grant')
  }

  if (
    found.clientId !== clientId ||
    found.redirectUri !== redirectUri ||
    !verifyPkce(codeVerifier, found.codeChallenge)
  ) {
    return errorResponse('invalid_grant')
  }

  const accessToken = generateOpaqueToken(OAUTH_ACCESS_TOKEN_PREFIX)
  const refreshToken = generateOpaqueToken(OAUTH_REFRESH_TOKEN_PREFIX)
  const now = Date.now()

  await prisma.oAuthAccessToken.create({
    data: {
      accessTokenHash: hashOAuthToken(accessToken),
      refreshTokenHash: hashOAuthToken(refreshToken),
      clientId: found.clientId,
      userId: found.userId,
      scope: OAUTH_SCOPE,
      accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  })

  return issueTokenResponse(accessToken, refreshToken)
}

async function handleRefreshToken(params: URLSearchParams) {
  const refreshToken = params.get('refresh_token')
  const clientId = params.get('client_id')

  if (!refreshToken || !clientId) {
    return errorResponse('invalid_request')
  }

  const found = await prisma.oAuthAccessToken.findUnique({
    where: { refreshTokenHash: hashOAuthToken(refreshToken) },
  })
  if (
    !found ||
    found.revokedAt !== null ||
    found.refreshTokenExpiresAt < new Date() ||
    found.clientId !== clientId
  ) {
    return errorResponse('invalid_grant')
  }

  const newAccessToken = generateOpaqueToken(OAUTH_ACCESS_TOKEN_PREFIX)
  const newRefreshToken = generateOpaqueToken(OAUTH_REFRESH_TOKEN_PREFIX)
  const now = Date.now()

  await prisma.oAuthAccessToken.update({
    where: { id: found.id },
    data: {
      accessTokenHash: hashOAuthToken(newAccessToken),
      refreshTokenHash: hashOAuthToken(newRefreshToken),
      accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  })

  return issueTokenResponse(newAccessToken, newRefreshToken)
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const bodyText = await request.text()
  const params = contentType.includes('application/json')
    ? new URLSearchParams(JSON.parse(bodyText))
    : new URLSearchParams(bodyText)

  const grantType = params.get('grant_type')

  if (grantType === 'authorization_code') {
    return handleAuthorizationCode(params)
  }
  if (grantType === 'refresh_token') {
    return handleRefreshToken(params)
  }
  return errorResponse('unsupported_grant_type')
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: responseHeaders })
}
