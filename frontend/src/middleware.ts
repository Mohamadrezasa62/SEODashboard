import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]

const AUTH_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')?.value
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path))

  if (!accessToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (accessToken && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}