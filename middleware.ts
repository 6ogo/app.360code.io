import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  // Create a Supabase client for the middleware
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  try {
    // Refresh the session
    await supabase.auth.getSession()
    
    // Return the response without any redirects
    return response
  } catch (error) {
    console.error('Supabase auth error:', error)
    // Return the response without any redirects even if there's an error
    return response
  }
}

// This middleware will run on these paths:
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
