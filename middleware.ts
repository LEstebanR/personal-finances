import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (
    !sessionCookie &&
    request.nextUrl.pathname !== '/' &&
    request.nextUrl.pathname !== '/login' &&
    request.nextUrl.pathname !== '/signup' &&
    !request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
