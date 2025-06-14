import { logout } from '@/app/login/actions'
import { NextResponse } from 'next/server'

export async function GET() {
  const result = await logout()

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL))
}
