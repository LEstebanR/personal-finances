import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to login and dashboard routes without authentication
  if (
    !user &&
    request.nextUrl.pathname !== '/login' &&
    request.nextUrl.pathname !== '/' &&
    request.nextUrl.pathname !== '/signup'
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
