import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a Supabase client for the middleware
  const response = NextResponse.next()
  
  // Create a Supabase client using the new API
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove: (name, options) => {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

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