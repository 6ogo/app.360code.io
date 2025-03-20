'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { useToast } from '@/components/providers/ToastProvider'

export default function AuthPage() {
  const { user, loading, signIn, signUp, signInWithProvider } = useSupabase()
  const { showToast } = useToast()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await signIn(email, password)
      showToast('Signed in successfully', 'success')
      // Router will handle redirect
    } catch (error) {
      console.error('Error signing in:', error)
      showToast(`Failed to sign in: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await signUp(email, password)
      showToast('Account created successfully! Please check your email to confirm.', 'success')
      setActiveTab('signin')
    } catch (error) {
      console.error('Error signing up:', error)
      showToast(`Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleProviderSignIn = async (provider: 'github' | 'google') => {
    try {
      await signInWithProvider(provider)
      // Redirect will be handled by OAuth flow
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      showToast(`Failed to sign in with ${provider}`, 'error')
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      {/* Background effects */}
      <div className="dot-pattern"></div>
      <div className="blue-glow top-right"></div>
      <div className="blue-glow bottom-left"></div>
      
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 text-center border-b border-border">
          <div className="flex items-center justify-center mb-4">
            <Image 
              src="/logo.svg" 
              alt="360code.io Logo" 
              width={40} 
              height={40} 
              className="mr-2" 
            />
            <h1 className="text-xl font-semibold">360code.io</h1>
          </div>
          <p>Sign in to access AI-powered code generation</p>
        </div>
        
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 text-center py-3 font-medium transition-colors ${activeTab === 'signin' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 text-center py-3 font-medium transition-colors ${activeTab === 'signup' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>
        
        <div className="p-6">
          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn}>
              <div className="mb-4">
                <label htmlFor="signinEmail" className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  id="signinEmail"
                  className="w-full px-3 py-3 rounded-md border border-border bg-card/50 text-foreground font-sans transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="signinPassword" className="block mb-2 text-sm">Password</label>
                <input
                  type="password"
                  id="signinPassword"
                  className="w-full px-3 py-3 rounded-md border border-border bg-card/50 text-foreground font-sans transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner w-5 h-5 mr-2"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : 'Sign In'}
                </button>
              </div>
            </form>
          )}
          
          {/* Sign Up Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label htmlFor="signupEmail" className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  id="signupEmail"
                  className="w-full px-3 py-3 rounded-md border border-border bg-card/50 text-foreground font-sans transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="signupPassword" className="block mb-2 text-sm">Password</label>
                <input
                  type="password"
                  id="signupPassword"
                  className="w-full px-3 py-3 rounded-md border border-border bg-card/50 text-foreground font-sans transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <small className="block mt-1 text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </small>
              </div>
              <div className="mb-4">
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner w-5 h-5 mr-2"></div>
                      <span>Signing up...</span>
                    </div>
                  ) : 'Sign Up'}
                </button>
              </div>
            </form>
          )}
          
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-border"></div>
            <div className="px-4 text-sm text-muted-foreground">Or {activeTab === 'signin' ? 'sign in' : 'sign up'} with</div>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleProviderSignIn('github')}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-md bg-card/70 text-foreground hover:bg-card/90 transition"
            >
              <i className="fab fa-github text-lg"></i>
              <span>GitHub</span>
            </button>
            <button
              onClick={() => handleProviderSignIn('google')}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-md bg-card/70 text-foreground hover:bg-card/90 transition"
            >
              <i className="fab fa-google text-lg text-red-500"></i>
              <span>Google</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 text-center text-xs text-muted-foreground border-t border-border">
          &copy; 2025 360code.io - All rights reserved
        </div>
      </div>
    </div>
  )
}