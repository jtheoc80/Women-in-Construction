'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { SiteLogo } from '@/components/SiteLogo'
import { Mail, Phone, Lock, Loader2, ArrowRight, RefreshCw } from 'lucide-react'

/** Build the redirect URL for email verification */
function getEmailRedirectTo(next: string): string {
  // Always use window.location.origin to support custom domains
  // This ensures the callback URL matches the domain the user is currently on
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  
  const callbackUrl = new URL('/auth/callback', base)
  callbackUrl.searchParams.set('next', next)
  
  return callbackUrl.toString()
}

/** Normalize phone number to E.164 format (+1...) */
function normalizePhoneToE164(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.trim()
  
  // If it already starts with +, preserve country code
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\D/g, '')
  }
  
  // Remove all non-digit characters
  cleaned = cleaned.replace(/\D/g, '')
  
  // If it's 10 digits, assume US number
  if (cleaned.length === 10) {
    return '+1' + cleaned
  }
  
  // If it's 11 digits and starts with 1, assume US number with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned
  }
  
  // Default: assume US number
  return '+1' + cleaned
}

/** Resend cooldown in seconds */
const RESEND_COOLDOWN_SECONDS = 30

type AuthMethod = 'email' | 'phone'
type EmailMode = 'password' | 'magic'
type Step = 'input' | 'verify'

export function SignInClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  const next = searchParams.get('next') || '/browse'
  const safeNext = next.startsWith('/') ? next : '/browse'
  
  // Check for error from auth callback
  const callbackError = searchParams.get('error')

  // Tab state
  const [activeTab, setActiveTab] = useState<AuthMethod>('email')
  
  // Email auth state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailMode, setEmailMode] = useState<EmailMode>('password')
  const [emailStep, setEmailStep] = useState<Step>('input')
  const [emailOtp, setEmailOtp] = useState('')
  
  // Phone auth state
  const [phone, setPhone] = useState('')
  const [phoneStep, setPhoneStep] = useState<Step>('input')
  const [phoneOtp, setPhoneOtp] = useState('')
  
  // Common state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(callbackError)
  const [message, setMessage] = useState<string | null>(null)
  
  // Resend cooldown state
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return
    
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Reset state when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AuthMethod)
    setError(null)
    setMessage(null)
  }

  // ==================== EMAIL: Password sign-in ====================
  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (process.env.NODE_ENV === 'development') {
      console.log('[SignIn] Attempting password sign-in:', { email: email.trim() })
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[SignIn] Password sign-in response:', {
          success: !!data?.session,
          error: signInError?.message,
        })
      }

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again or sign up for a new account.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the verification link to confirm your account.')
        } else {
          setError(signInError.message)
        }
        return
      }

      router.push(safeNext)
      router.refresh()
    } catch (err) {
      console.error('[SignIn] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== EMAIL: Magic link ====================
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const emailRedirectTo = getEmailRedirectTo(safeNext)

    if (process.env.NODE_ENV === 'development') {
      console.log('[SignIn] Sending magic link:', {
        email: email.trim(),
        emailRedirectTo,
      })
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo,
        },
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[SignIn] Magic link response:', {
          error: otpError?.message,
          errorCode: otpError?.status,
        })
      }

      if (otpError) {
        if (otpError.message.includes('redirect')) {
          setError(`Email delivery failed: ${otpError.message}. Please contact support if this persists.`)
        } else if (otpError.message.includes('rate limit') || otpError.message.includes('too many')) {
          setError('Too many requests. Please wait a moment before trying again.')
        } else {
          setError(otpError.message)
        }
        return
      }

      setEmailStep('verify')
      setMessage('Check your email for a sign-in link or enter the 6-digit code.')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[SignIn] Magic link error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== EMAIL: Verify OTP ====================
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: emailOtp.trim(),
        type: 'email',
      })

      if (verifyError) {
        if (verifyError.message.includes('Token has expired')) {
          setError('Code expired. Please request a new one.')
        } else if (verifyError.message.includes('Invalid')) {
          setError('Invalid code. Please check and try again.')
        } else {
          setError(verifyError.message)
        }
        return
      }

      if (data?.session) {
        router.push(safeNext)
        router.refresh()
      }
    } catch (err) {
      console.error('[SignIn] Email OTP verify error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== EMAIL: Forgot password ====================
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError(null)

    const emailRedirectTo = getEmailRedirectTo('/sign-in')

    if (process.env.NODE_ENV === 'development') {
      console.log('[SignIn] Sending password reset:', {
        email: email.trim(),
        emailRedirectTo,
      })
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: emailRedirectTo,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[SignIn] Password reset response:', {
          error: resetError?.message,
        })
      }

      if (resetError) {
        if (resetError.message.includes('redirect')) {
          setError(`Email delivery failed: ${resetError.message}. Please contact support if this persists.`)
        } else {
          setError(resetError.message)
        }
        return
      }

      setEmailStep('verify')
      setMessage('Check your email for a password reset link.')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[SignIn] Password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== PHONE: Send OTP ====================
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const formattedPhone = normalizePhoneToE164(phone)

    if (process.env.NODE_ENV === 'development') {
      console.log('[SignIn] Sending phone OTP:', { phone: formattedPhone })
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[SignIn] Phone OTP response:', {
          error: otpError?.message,
        })
      }

      if (otpError) {
        if (otpError.message.includes('rate limit') || otpError.message.includes('too many')) {
          setError('Too many requests. Please wait a moment before trying again.')
        } else if (otpError.message.includes('invalid') && otpError.message.includes('phone')) {
          setError('Invalid phone number format. Please enter a valid US phone number.')
        } else if (otpError.message.includes('not enabled')) {
          setError('Phone authentication is not enabled. Please use email instead.')
        } else {
          setError(otpError.message)
        }
        return
      }

      setPhoneStep('verify')
      setMessage(`We sent a code to ${formattedPhone}. Enter it below.`)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[SignIn] Phone OTP error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== PHONE: Verify OTP ====================
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formattedPhone = normalizePhoneToE164(phone)

    if (process.env.NODE_ENV === 'development') {
      console.log('[SignIn] Verifying phone OTP:', { phone: formattedPhone })
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: phoneOtp.trim(),
        type: 'sms',
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[SignIn] Phone OTP verify response:', {
          success: !!data?.session,
          error: verifyError?.message,
        })
      }

      if (verifyError) {
        if (verifyError.message.includes('Token has expired')) {
          setError('Code expired. Please request a new one.')
        } else if (verifyError.message.includes('Invalid')) {
          setError('Invalid code. Please check and try again.')
        } else {
          setError(verifyError.message)
        }
        return
      }

      if (data?.session) {
        router.push(safeNext)
        router.refresh()
      }
    } catch (err) {
      console.error('[SignIn] Phone OTP verify error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== Resend code ====================
  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0 || resendLoading) return
    
    setResendLoading(true)
    setError(null)

    try {
      if (activeTab === 'email') {
        const emailRedirectTo = getEmailRedirectTo(safeNext)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo },
        })

        if (otpError) {
          setError(otpError.message)
          return
        }

        setMessage('New code sent! Check your email.')
      } else {
        const formattedPhone = normalizePhoneToE164(phone)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: { channel: 'sms' },
        })

        if (otpError) {
          setError(otpError.message)
          return
        }

        setMessage(`New code sent to ${formattedPhone}!`)
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('[SignIn] Resend error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }, [activeTab, email, phone, safeNext, resendCooldown, resendLoading, supabase.auth])

  // ==================== Reset to input step ====================
  const handleBackToInput = () => {
    if (activeTab === 'email') {
      setEmailStep('input')
      setEmailOtp('')
    } else {
      setPhoneStep('input')
      setPhoneOtp('')
    }
    setError(null)
    setMessage(null)
  }

  // ==================== Render email verification step ====================
  if (activeTab === 'email' && emailStep === 'verify') {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-slate-950">
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
              <h1 className="text-xl font-semibold text-white sm:text-2xl">Check your email</h1>
              <p className="mt-3 text-sm text-white/70 sm:text-base">
                We sent a link to <span className="font-medium text-white">{email}</span>.
              </p>
              
              {/* OTP input form */}
              <form onSubmit={handleVerifyEmailOtp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-otp" className="text-sm font-medium text-white/90">
                    Or enter 6-digit code
                  </Label>
                  <Input
                    id="email-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 border-white/10 bg-white/5 text-center text-2xl tracking-widest text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20"
                    maxLength={6}
                  />
                </div>
                
                {message && (
                  <div className="rounded-lg bg-teal-500/10 p-3 text-sm text-teal-400">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || emailOtp.length < 6}
                  className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify code'
                  )}
                </Button>
              </form>
              
              {/* Resend section */}
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleResendCode}
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
                      Resend code
                    </>
                  )}
                </button>
                
                <div className="border-t border-white/10 pt-3">
                  <button
                    onClick={handleBackToInput}
                    className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-white/60 hover:text-white/90"
                  >
                    Use a different email
                  </button>
                </div>
                
                <p className="text-xs text-white/50">
                  Didn&apos;t receive the email? Check your spam folder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ==================== Render phone verification step ====================
  if (activeTab === 'phone' && phoneStep === 'verify') {
    const formattedPhone = normalizePhoneToE164(phone)
    
    return (
      <main className="flex min-h-[100dvh] flex-col bg-slate-950">
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
                <Phone className="h-7 w-7 text-teal-400" />
              </div>
              <h1 className="text-xl font-semibold text-white sm:text-2xl">Enter your code</h1>
              <p className="mt-3 text-sm text-white/70 sm:text-base">
                We sent a code to <span className="font-medium text-white">{formattedPhone}</span>
              </p>
              
              {/* OTP input form */}
              <form onSubmit={handleVerifyPhoneOtp} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-otp" className="text-sm font-medium text-white/90">
                    6-digit code
                  </Label>
                  <Input
                    id="phone-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 border-white/10 bg-white/5 text-center text-2xl tracking-widest text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20"
                    maxLength={6}
                  />
                </div>
                
                {message && (
                  <div className="rounded-lg bg-teal-500/10 p-3 text-sm text-teal-400">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || phoneOtp.length < 6}
                  className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & sign in'
                  )}
                </Button>
              </form>
              
              {/* Resend section */}
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleResendCode}
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
                      Resend code
                    </>
                  )}
                </button>
                
                <div className="border-t border-white/10 pt-3">
                  <button
                    onClick={handleBackToInput}
                    className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-white/60 hover:text-white/90"
                  >
                    Use a different number
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ==================== Render main sign-in form with tabs ====================
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
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              Sign in to your account to continue
            </p>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1">
                <TabsTrigger 
                  value="email" 
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="phone"
                  className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              {/* ==================== EMAIL TAB ==================== */}
              <TabsContent value="email" className="mt-6">
                {emailMode === 'password' ? (
                  <form onSubmit={handleSignInWithPassword} className="space-y-5">
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-white/90">
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="min-h-[44px] px-2 text-sm text-teal-400 hover:text-teal-300"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 border-white/10 bg-white/5 pl-12 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20 sm:h-14 sm:text-base"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !email.trim() || !password}
                      className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSendMagicLink} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email" className="text-sm font-medium text-white/90">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <Input
                          id="magic-email"
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

                    {error && (
                      <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send magic link
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode(emailMode === 'password' ? 'magic' : 'password')
                      setError(null)
                    }}
                    className="min-h-[44px] px-4 text-sm text-white/60 hover:text-white/90"
                  >
                    {emailMode === 'password' ? 'Sign in with magic link' : 'Sign in with password'}
                  </button>
                </div>
              </TabsContent>

              {/* ==================== PHONE TAB ==================== */}
              <TabsContent value="phone" className="mt-6">
                <form onSubmit={handleSendPhoneOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-white/90">
                      Phone number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12 border-white/10 bg-white/5 pl-12 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:ring-teal-500/20 sm:h-14 sm:text-base"
                        required
                        autoComplete="tel"
                      />
                    </div>
                    <p className="text-xs text-white/50">
                      We&apos;ll send you a 6-digit code via SMS. Standard rates may apply.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !phone.trim()}
                    className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send code
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-white/60">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/signup${safeNext !== '/browse' ? `?next=${encodeURIComponent(safeNext)}` : ''}`}
                  className="min-h-[44px] font-semibold text-teal-400 hover:text-teal-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            Your email or phone is never shown publicly.
          </p>
        </div>
      </div>
    </main>
  )
}
