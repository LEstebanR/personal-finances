import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

import { approveAuthorization, denyAuthorization } from './actions'
import { OAuthSignInButton } from './oauth-sign-in-button'

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-24 flex w-full flex-col items-center gap-4 px-4">
      <Logo />
      <Card className="w-full md:w-4/12">
        <CardHeader>
          <CardTitle>Can&apos;t continue</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  const responseType = params.response_type
  const clientId = params.client_id
  const redirectUri = params.redirect_uri
  const codeChallenge = params.code_challenge
  const codeChallengeMethod = params.code_challenge_method
  const state = typeof params.state === 'string' ? params.state : ''

  if (
    responseType !== 'code' ||
    typeof clientId !== 'string' ||
    typeof redirectUri !== 'string' ||
    typeof codeChallenge !== 'string' ||
    codeChallengeMethod !== 'S256'
  ) {
    return <ErrorScreen message="Invalid authorization request." />
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { id: clientId },
  })
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return <ErrorScreen message="Unknown client or redirect URI." />
  }

  const session = await getServerSession()

  if (!session) {
    const originalQuery = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') originalQuery.set(key, value)
    }

    return (
      <div className="mx-auto mt-24 flex w-full flex-col items-center gap-4 px-4">
        <Logo />
        <Card className="flex w-full flex-col md:w-4/12">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Sign in to continue
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Sign in to authorize {client.name}.
            </CardDescription>
            <CardContent className="mt-4">
              <OAuthSignInButton
                callbackURL={`/oauth/authorize?${originalQuery.toString()}`}
              />
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-24 flex w-full flex-col items-center gap-4 px-4">
      <Logo />
      <Card className="flex w-full flex-col md:w-5/12">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Authorize {client.name}
          </CardTitle>
          <CardDescription className="text-center">
            {client.name} wants to connect to your Personal Finances data. This
            will let it view your accounts, transactions, subscriptions, debts,
            and budgets, and create new transactions and transfers on your
            behalf.
          </CardDescription>
          <CardContent className="mt-4">
            <form className="flex flex-col gap-2">
              <input type="hidden" name="client_id" value={clientId} />
              <input type="hidden" name="redirect_uri" value={redirectUri} />
              <input
                type="hidden"
                name="code_challenge"
                value={codeChallenge}
              />
              <input type="hidden" name="state" value={state} />
              <Button formAction={approveAuthorization}>Authorize</Button>
              <Button formAction={denyAuthorization} variant="outline">
                Deny
              </Button>
            </form>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  )
}
