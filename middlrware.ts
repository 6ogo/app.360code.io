import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  // Create a Supabase client for the middleware
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/auth/callback', '/api/generate']

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If accessing a protected route without a session, redirect to /auth
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/auth', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing the auth page with a valid session, redirect to the home page
  if (session && request.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// This middleware will run on these paths:
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}