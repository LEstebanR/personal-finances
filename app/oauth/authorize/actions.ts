'use server'

import {
  AUTH_CODE_TTL_SECONDS,
  OAUTH_SCOPE,
  generateOpaqueToken,
  hashOAuthToken,
} from '@/lib/oauth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { redirect } from 'next/navigation'

async function validateClientAndRedirect(
  clientId: string,
  redirectUri: string
) {
  const client = await prisma.oAuthClient.findUnique({
    where: { id: clientId },
  })
  if (!client || !client.redirectUris.includes(redirectUri)) return null
  return client
}

export async function approveAuthorization(formData: FormData) {
  const clientId = String(formData.get('client_id') ?? '')
  const redirectUri = String(formData.get('redirect_uri') ?? '')
  const codeChallenge = String(formData.get('code_challenge') ?? '')
  const state = String(formData.get('state') ?? '')

  const client = await validateClientAndRedirect(clientId, redirectUri)
  if (!client) throw new Error('Invalid client or redirect URI')

  const session = await getServerSession()
  if (!session) {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      ...(state ? { state } : {}),
    })
    redirect(`/oauth/authorize?${query.toString()}`)
  }

  const code = generateOpaqueToken('')
  await prisma.oAuthAuthorizationCode.create({
    data: {
      codeHash: hashOAuthToken(code),
      clientId: client.id,
      userId: session.user.id,
      redirectUri,
      codeChallenge,
      scope: OAUTH_SCOPE,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
    },
  })

  const redirectUrl = new URL(redirectUri)
  redirectUrl.searchParams.set('code', code)
  if (state) redirectUrl.searchParams.set('state', state)
  redirect(redirectUrl.toString())
}

export async function denyAuthorization(formData: FormData) {
  const clientId = String(formData.get('client_id') ?? '')
  const redirectUri = String(formData.get('redirect_uri') ?? '')
  const state = String(formData.get('state') ?? '')

  const client = await validateClientAndRedirect(clientId, redirectUri)
  if (!client) throw new Error('Invalid client or redirect URI')

  const redirectUrl = new URL(redirectUri)
  redirectUrl.searchParams.set('error', 'access_denied')
  if (state) redirectUrl.searchParams.set('state', state)
  redirect(redirectUrl.toString())
}
