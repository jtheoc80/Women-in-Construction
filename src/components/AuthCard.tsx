'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'

type AuthStep = 'send' | 'verify'

interface AuthCardProps {
  mode?: 'signup' | 'login'
  onSuccess?: () => void
  redirectTo?: string
}

const RESEND_COOLDOWN = 30 // seconds

export function AuthCard({ mode = 'signup', onSuccess, redirectTo }: AuthCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isProfileComplete, refreshProfile } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [step, setStep] = useState<AuthStep>('send')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  const supabase = getSupabaseBrowserClient()
  const nextUrl = redirectTo || searchParams.get('next') || '/design'

  // Handle resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Handle redirect after auth
  const handleAuthSuccess = useCallback(async () => {
    await refreshProfile()
    
    if (onSuccess) {
      onSuccess()
      return
    }

    // Check if profile is complete
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, home_city')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    const profileComplete = profile?.first_name && profile?.home_city

    if (!profileComplete) {
      // Redirect to onboarding with the original next URL
      router.push(`/onboarding?next=${encodeURIComponent(nextUrl)}`)
    } else {
      router.push(nextUrl)
    }
  }, [refreshProfile, onSuccess, router, nextUrl, supabase])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'SIGNED_IN') {
          await handleAuthSuccess()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, handleAuthSuccess])

  // If already logged in, handle redirect
  useEffect(() => {
    if (user && !loading) {
      if (isProfileComplete) {
        router.push(nextUrl)
      } else {
        router.push(`/onboarding?next=${encodeURIComponent(nextUrl)}`)
      }
    }
  }, [user, isProfileComplete, router, nextUrl, loading])

  const resetState = () => {
    setStep('send')
    setOtp('')
    setError(null)
    setMessage(null)
  }

  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage(`We sent a code to ${email}`)
        setStep('verify')
        setResendTimer(RESEND_COOLDOWN)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Format phone number
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage(`We sent a code to ${formattedPhone}`)
        setStep('verify')
        setResendTimer(RESEND_COOLDOWN)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      })

      if (error) {
        setError(error.message)
      }
      // Success handled by onAuthStateChange listener
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: 'sms',
      })

      if (error) {
        setError(error.message)
      }
      // Success handled by onAuthStateChange listener
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return
    
    setError(null)
    setOtp('')
    
    if (activeTab === 'email') {
      setLoading(true)
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        })
        if (error) {
          setError(error.message)
        } else {
          setMessage('New code sent!')
          setResendTimer(RESEND_COOLDOWN)
        }
      } catch {
        setError('Failed to resend code')
      } finally {
        setLoading(false)
      }
    } else {
      let formattedPhone = phone.trim()
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
      }
      
      setLoading(true)
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
          options: { shouldCreateUser: true },
        })
        if (error) {
          setError(error.message)
        } else {
          setMessage('New code sent!')
          setResendTimer(RESEND_COOLDOWN)
        }
      } catch {
        setError('Failed to resend code')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBackToSend = () => {
    resetState()
  }

  const title = mode === 'signup' ? 'Create your account' : 'Welcome back'
  const description = mode === 'signup' 
    ? 'Sign up with your email or phone. No password needed!'
    : 'Sign in with your email or phone. No password needed!'

  return (
    <Card className="w-full max-w-md bg-white shadow-lg border-slate-200">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800">{title}</CardTitle>
        <CardDescription className="text-slate-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => {
            setActiveTab(v as 'email' | 'phone')
            resetState()
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
            <TabsTrigger 
              value="email" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              📧 Email
            </TabsTrigger>
            <TabsTrigger 
              value="phone"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              📱 Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-0">
            {step === 'send' ? (
              <form onSubmit={handleSendEmailOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-email" className="text-slate-700">
                    Email address
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Continue with Email'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-otp" className="text-slate-700">
                    Enter verification code
                  </Label>
                  <Input
                    id="email-otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {message && (
                    <p className="text-sm text-green-600">{message}</p>
                  )}
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleBackToSend}
                    className="text-sm text-slate-600 hover:text-slate-800"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || loading}
                    className={`text-sm ${
                      resendTimer > 0 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : 'text-orange-600 hover:text-orange-700'
                    }`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </TabsContent>

          <TabsContent value="phone" className="mt-0">
            {step === 'send' ? (
              <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-phone" className="text-slate-700">
                    Phone number
                  </Label>
                  <Input
                    id="auth-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                    className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">
                    We&apos;ll text you a verification code
                  </p>
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Continue with Phone'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-otp" className="text-slate-700">
                    Enter verification code
                  </Label>
                  <Input
                    id="phone-otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  {message && (
                    <p className="text-sm text-green-600">{message}</p>
                  )}
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleBackToSend}
                    className="text-sm text-slate-600 hover:text-slate-800"
                  >
                    ← Change phone
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || loading}
                    className={`text-sm ${
                      resendTimer > 0 
                        ? 'text-slate-400 cursor-not-allowed' 
                        : 'text-orange-600 hover:text-orange-700'
                    }`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs text-center text-slate-500">
            🔒 Your contact info is never shared publicly.<br />
            Only revealed when both parties accept an intro.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
