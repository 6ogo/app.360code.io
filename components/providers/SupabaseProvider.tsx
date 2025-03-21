'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type SupabaseContextType = {
  supabase: SupabaseClient
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

// Create a client-side singleton to prevent multiple instances
let supabaseClient: SupabaseClient | null = null

const getSupabaseClient = () => {
  if (!supabaseClient && typeof window !== 'undefined') {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClient
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize Supabase client on the client side
    const client = getSupabaseClient()
    setSupabase(client)

    const getUser = async () => {
      if (!client) return

      try {
        const { data: { user }, error } = await client.auth.getUser()
        if (error) {
          console.error('Error fetching user:', error)
          setUser(null)
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Only set up listeners when client exists
    if (client) {
      const { data: { subscription } } = client.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          router.refresh()
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return Promise.reject('No Supabase client')
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
      
      router.push('/')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return Promise.reject('No Supabase client')
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return Promise.reject('No Supabase client')
    
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
      // If there's an error (like the auth page doesn't exist), redirect to home
      router.push('/')
    }
  }

  const signInWithProvider = async (provider: 'github' | 'google') => {
    if (!supabase) return Promise.reject('No Supabase client')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      throw error
    }
  }

  // Only render children when supabase is available
  if (!supabase) {
    return null
  }

  const value = {
    supabase,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}