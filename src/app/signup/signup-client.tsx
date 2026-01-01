'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Phone, UserPlus } from 'lucide-react'

type AuthStep = 'send' | 'verify'

const INVITE_CODE_STORAGE_KEY = 'sitesisters_invite_code'
const INVITE_CODE_COOKIE = 'invite_code'

function safeNextParam(nextParam: string | null): string | null {
  if (!nextParam) return null
  return nextParam.startsWith('/') ? nextParam : null
}

/** Read invite code from cookie */
function getInviteCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${INVITE_CODE_COOKIE}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

/** Clear invite code from cookie */
function clearInviteCodeCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${INVITE_CODE_COOKIE}=; path=/; max-age=0`
}

/** Store invite code in localStorage with 7-day expiry */
function storeInviteCode(code: string) {
  if (typeof localStorage === 'undefined') return
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  localStorage.setItem(INVITE_CODE_STORAGE_KEY, JSON.stringify({ code, expires }))
}

/** Get invite code from localStorage if not expired */
function getStoredInviteCode(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const stored = localStorage.getItem(INVITE_CODE_STORAGE_KEY)
    if (!stored) return null
    const { code, expires } = JSON.parse(stored)
    if (Date.now() > expires) {
      localStorage.removeItem(INVITE_CODE_STORAGE_KEY)
      return null
    }
    return code
  } catch {
    return null
  }
}

/** Clear all stored invite codes */
function clearAllInviteCodes() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(INVITE_CODE_STORAGE_KEY)
  }
  clearInviteCodeCookie()
}

interface InviteStatus {
  ok: boolean
  reason?: string
}

export function SignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isProfileComplete, refreshProfile } = useAuth()

  const supabase = getSupabaseBrowserClient()

  const nextParam = useMemo(() => safeNextParam(searchParams.get('next')), [searchParams])
  const inviteCodeFromUrl = useMemo(() => searchParams.get('invite'), [searchParams])
  const defaultAfterAuth = nextParam || '/browse'

  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [step, setStep] = useState<AuthStep>('send')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  
  // Invite state
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<InviteStatus | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  // Get the effective invite code from URL, cookie, or localStorage
  useEffect(() => {
    const code = inviteCodeFromUrl || getInviteCodeFromCookie() || getStoredInviteCode()
    if (code) {
      setInviteCode(code)
      // Also store in localStorage for persistence across the OTP flow
      storeInviteCode(code)
    }
  }, [inviteCodeFromUrl])

  // Validate invite code when we have one
  useEffect(() => {
    const validateInvite = async (code: string) => {
      setInviteLoading(true)
      try {
        const res = await fetch(`/api/invites/resolve?code=${encodeURIComponent(code)}`)
        const data = await res.json()
        
        setInviteStatus({
          ok: data.ok,
          reason: data.reason,
        })

        // If invalid, don't clear yet - let user see the message
      } catch (err) {
        console.error('Error validating invite:', err)
        setInviteStatus({ ok: false, reason: 'Failed to validate invite.' })
      } finally {
        setInviteLoading(false)
      }
    }

    if (inviteCode) {
      validateInvite(inviteCode)
    }
  }, [inviteCode])

  // Consume invite after successful signup
  const consumeInvite = useCallback(async () => {
    // Get code from all possible sources
    const code = inviteCode || getStoredInviteCode() || getInviteCodeFromCookie()
    
    // Always clear stored codes after attempting consumption
    clearAllInviteCodes()
    
    if (!code) return

    try {
      const res = await fetch('/api/invites/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()
      if (!data.ok) {
        console.warn('Failed to consume invite:', data.reason)
      }
    } catch (err) {
      console.error('Error consuming invite:', err)
    }
  }, [inviteCode])

  useEffect(() => {
    // Already signed in: go where you intended.
    if (user) {
      if (!isProfileComplete) {
        router.replace(
          `/account?onboarding=1${nextParam ? `&next=${encodeURIComponent(nextParam)}` : ''}`
        )
      } else {
        router.replace(defaultAfterAuth)
      }
    }
  }, [user, isProfileComplete, router, nextParam, defaultAfterAuth])

  const resetForTab = () => {
    setStep('send')
    setOtp('')
    setError(null)
    setMessage(null)
  }

  const handleSendEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })

      if (sendError) {
        setError(sendError.message)
        return
      }

      setMessage('Enter the 8-digit code from your email.')
      setStep('verify')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    // Ensure it starts with +. If not, assume US.
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
    }

    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { shouldCreateUser: true },
      })

      if (sendError) {
        setError(sendError.message)
        return
      }

      setMessage('Enter the 8-digit code from your text message.')
      setStep('verify')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Format phone consistently for verify
    let formattedPhone = phone.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '')
    }

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp(
        activeTab === 'email'
          ? { email: email.trim(), token: otp.trim(), type: 'email' }
          : { phone: formattedPhone, token: otp.trim(), type: 'sms' }
      )

      if (verifyError) {
        setError(verifyError.message)
        return
      }

      // Ensure profile exists (trigger should have created it), then decide where to go.
      await refreshProfile()

      const { data: { user: authedUser } } = await supabase.auth.getUser()
      if (!authedUser) {
        setError('Signed in, but could not load your session. Please refresh and try again.')
        return
      }

      // Consume the invite code if one was used (always clears after attempt)
      await consumeInvite()

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('first_name,home_city')
        .eq('id', authedUser.id)
        .single()

      const complete = Boolean(profileRow?.first_name?.trim() && profileRow?.home_city?.trim())

      if (!complete) {
        router.replace(
          `/account?onboarding=1${nextParam ? `&next=${encodeURIComponent(nextParam)}` : ''}`
        )
      } else {
        router.replace(defaultAfterAuth)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendAgain = () => {
    setStep('send')
    setOtp('')
    setError(null)
    setMessage(null)
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-slate-600">
          We&apos;ll send an 8-digit code. No magic links.
        </p>

        {/* Invite banner */}
        {inviteLoading && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Validating invite...</p>
          </div>
        )}
        
        {!inviteLoading && inviteStatus && (
          <div className={`mt-4 rounded-lg border p-4 ${
            inviteStatus.ok 
              ? 'border-emerald-200 bg-emerald-50' 
              : 'border-amber-200 bg-amber-50'
          }`}>
            {inviteStatus.ok ? (
              <div className="flex items-start gap-3">
                <UserPlus className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="font-medium text-emerald-900">
                    You have a valid invite!
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Sign up below to join.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-medium text-amber-900">Invite not valid</p>
                <p className="mt-1 text-sm text-amber-700">
                  {inviteStatus.reason || 'This invite code is invalid or has expired.'}
                </p>
                <p className="mt-2 text-sm text-amber-600">
                  You can still sign up if you have access.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as 'email' | 'phone')
              resetForTab()
            }}
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger value="email" className="data-[state=active]:bg-white">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  Email
                </span>
              </TabsTrigger>
              <TabsTrigger value="phone" className="data-[state=active]:bg-white">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-600" aria-hidden="true" />
                  Phone
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6">
              {step === 'send' ? (
                <form onSubmit={handleSendEmailOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={loading || !email.trim()} className="w-full">
                    {loading ? 'Sending...' : 'Send code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-otp" className="text-slate-700">
                      8-digit code
                    </Label>
                    <Input
                      id="email-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="12345678"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      required
                      maxLength={8}
                      className="text-center text-2xl tracking-widest"
                    />
                    {message && <p className="text-sm text-slate-600">{message}</p>}
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={loading || otp.trim().length !== 8} className="w-full">
                    {loading ? 'Verifying...' : 'Verify & continue'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleSendAgain}
                    className="w-full text-sm text-slate-600 hover:text-slate-900"
                  >
                    Send a new code
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="phone" className="mt-6">
              {step === 'send' ? (
                <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700">
                      Phone number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 555 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-xs text-slate-500">
                      We&apos;ll text you an 8-digit code.
                    </p>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={loading || !phone.trim()} className="w-full">
                    {loading ? 'Sending...' : 'Send code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-otp" className="text-slate-700">
                      8-digit code
                    </Label>
                    <Input
                      id="phone-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="12345678"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      required
                      maxLength={8}
                      className="text-center text-2xl tracking-widest"
                    />
                    {message && <p className="text-sm text-slate-600">{message}</p>}
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={loading || otp.trim().length !== 8} className="w-full">
                    {loading ? 'Verifying...' : 'Verify & continue'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleSendAgain}
                    className="w-full text-sm text-slate-600 hover:text-slate-900"
                  >
                    Send a new code
                  </button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-slate-500">
            Your email/phone is never shown publicly.
          </p>
        </div>
      </div>
    </main>
  )
}
