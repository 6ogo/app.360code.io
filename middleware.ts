import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a response to modify
  const response = NextResponse.next()
  
  // Create a Supabase client using cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  // Get the user's session
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get the URL and pathname
  const url = request.nextUrl.clone()
  const { pathname } = url
  
  // Check if this is a direct access to app.360code.io
  const hostname = request.headers.get('host') || ''
  const isAppSubdomain = hostname.startsWith('app.') || hostname.includes('app.360code.io')
  
  // If on app subdomain and not authenticated and not already on auth page
  if (isAppSubdomain && !session && !pathname.startsWith('/auth')) {
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }
  
  // If authenticated and trying to access auth page
  if (session && pathname.startsWith('/auth')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

// This middleware will run on all paths except these
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}