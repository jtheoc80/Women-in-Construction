'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { SiteLogo } from '@/components/SiteLogo'
import { Mail, Lock, User, Loader2, ArrowRight, Check, RefreshCw } from 'lucide-react'

/** Build the redirect URL for email verification */
function getEmailRedirectTo(next: string): string {
  // Always use window.location.origin to support custom domains
  // This ensures the callback URL matches the domain the user is currently on
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  
  const callbackUrl = new URL('/auth/callback', base)
  callbackUrl.searchParams.set('next', next)
  
  return callbackUrl.toString()
}

/** Resend cooldown in seconds */
const RESEND_COOLDOWN_SECONDS = 30

interface SignUpClientProps {
  next: string | null
}

export function SignUpClient({ next: nextProp }: SignUpClientProps) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const next = nextProp || '/browse'
  const safeNext = next.startsWith('/') ? next : '/browse'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  
  // Resend cooldown state
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ]

  const isPasswordValid = passwordRequirements.every(req => req.met)

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return
    
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      const unmetRequirements = passwordRequirements
        .filter(req => !req.met)
        .map(req => req.text)
      const requirementsText = unmetRequirements.join(', ')
      setError(
        unmetRequirements.length
          ? `Please meet all password requirements: ${requirementsText}`
          : 'Please meet all password requirements'
      )
      return
    }

    setLoading(true)
    setError(null)

    const emailRedirectTo = getEmailRedirectTo(safeNext)
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[SignUp] Attempting signup with:', {
        email: email.trim(),
        emailRedirectTo,
      })
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            display_name: displayName.trim() || email.split('@')[0],
          },
        },
      })

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[SignUp] Response:', {
          user: signUpData?.user?.id,
          session: !!signUpData?.session,
          error: signUpError?.message,
          errorCode: signUpError?.status,
        })
      }

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.')
        } else if (signUpError.message.includes('redirect')) {
          // Likely a redirect URL allowlist issue
          setError(`Email delivery failed: ${signUpError.message}. Please contact support if this persists.`)
        } else {
          setError(signUpError.message)
        }
        return
      }

      // Check if email confirmation is required
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Auto-confirmed (dev mode or provider settings)
        router.push(safeNext)
        router.refresh()
      } else {
        // In development mode with DEV_AUTO_CONFIRM, auto-confirm the user
        const isDev = process.env.NODE_ENV === 'development'
        const devAutoConfirm = process.env.NEXT_PUBLIC_DEV_AUTO_CONFIRM === 'true'
        
        if (isDev && devAutoConfirm && signUpData.user) {
          try {
            const res = await fetch('/api/auth/dev-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: signUpData.user.id }),
            })
            
            if (res.ok) {
              // Sign in the user after auto-confirmation
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              })
              
              if (!signInError) {
                router.push(safeNext)
                router.refresh()
                return
              }
            }
          } catch (devErr) {
            console.warn('Dev auto-confirm failed, falling back to email confirmation:', devErr)
          }
        }
        
        // Confirmation email sent (or dev confirm failed)
        setConfirmationSent(true)
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
      }
    } catch (err) {
      // Catch any unexpected errors
      console.error('[SignUp] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0 || resendLoading) return
    
    setResendLoading(true)
    setResendMessage(null)
    setError(null)

    const emailRedirectTo = getEmailRedirectTo(safeNext)

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[SignUp] Resending verification email:', {
        email: email.trim(),
        emailRedirectTo,
      })
    }

    try {
      // Use resend method for verification emails
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo,
        },
      })

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[SignUp] Resend response:', {
          error: resendError?.message,
          errorCode: resendError?.status,
        })
      }

      if (resendError) {
        setError(resendError.message)
        return
      }

      setResendMessage('Verification email resent! Check your inbox.')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[SignUp] Resend error:', err)
      setError('Failed to resend email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }, [email, safeNext, resendCooldown, resendLoading, supabase.auth])

  if (confirmationSent) {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-center border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-lg">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo />
            <span className="text-lg font-bold tracking-tight text-white">SiteSisters</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center shadow-2xl backdrop-blur sm:p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20">
                <Mail className="h-7 w-7 text-teal-400" />
              </div>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">Verify your email</h1>
              <p className="mt-3 text-sm text-white/70 sm:text-base">
                We sent a verification link to <span className="font-medium text-white">{email}</span>.
                Click the link in your email to activate your account.
              </p>
              
              {/* Resend section */}
              <div className="mt-6 space-y-3">
                {/* Success/Error messages */}
                {resendMessage && (
                  <div className="rounded-lg bg-teal-500/10 p-3 text-sm text-teal-400">
                    {resendMessage}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                
                {/* Resend button */}
                <button
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-medium text-teal-400 hover:text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Resend verification email
                    </>
                  )}
                </button>
                
                <div className="border-t border-white/10 pt-3">
                  <button
                    onClick={() => {
                      setConfirmationSent(false)
                      setEmail('')
                      setPassword('')
                      setDisplayName('')
                      setError(null)
                      setResendMessage(null)
                    }}
                    className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-white/60 hover:text-white/90"
                  >
                    Use a different email
                  </button>
                </div>
                
                <p className="text-xs text-white/50">
                  Didn&apos;t receive the email? Check your spam folder.
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs text-amber-400">
                      <strong>Dev tip:</strong> To skip email verification during testing, add{' '}
                      <code className="rounded bg-white/10 px-1 py-0.5">NEXT_PUBLIC_DEV_AUTO_CONFIRM=true</code>{' '}
                      to your <code className="rounded bg-white/10 px-1 py-0.5">.env.local</code> file and restart the dev server.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-center border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-lg">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo />
          <span className="text-lg font-bold tracking-tight text-white">SiteSisters</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Create your account</h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              Join the community of women in construction
            </p>

            <form onSubmit={handleSignUp} className="mt-6 space-y-5 sm:mt-8">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-white/90">
                  Display name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Sarah M."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 border-white/10 bg-white/5 pl-12 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20 sm:h-14 sm:text-base"
                    autoComplete="name"
                  />
                </div>
                <p className="text-xs text-white/50">This is how others will see you</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/90">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-white/10 bg-white/5 pl-12 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20 sm:h-14 sm:text-base"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/90">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-white/10 bg-white/5 pl-12 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20 sm:h-14 sm:text-base"
                    required
                    autoComplete="new-password"
                  />
                </div>
                
                {/* Password requirements */}
                <div className="mt-3 space-y-1.5">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        req.met ? 'bg-teal-500' : 'bg-white/10'
                      }`}>
                        {req.met && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-xs ${req.met ? 'text-teal-400' : 'text-white/50'}`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email.trim() || !password || !isPasswordValid}
                className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-white/50">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            <div className="mt-6 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-white/60">
                Already have an account?{' '}
                <Link
                  href={`/sign-in${safeNext !== '/browse' ? `?next=${encodeURIComponent(safeNext)}` : ''}`}
                  className="min-h-[44px] font-semibold text-teal-400 hover:text-teal-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            Your email is never shown publicly.
          </p>
        </div>
      </div>
    </main>
  )
}
