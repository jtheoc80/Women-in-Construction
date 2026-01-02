'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { SiteLogo } from '@/components/SiteLogo'
import { Mail, Lock, User, Loader2, ArrowRight, Check } from 'lucide-react'

export function SignUpClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  const next = searchParams.get('next') || '/design'
  const safeNext = next.startsWith('/') ? next : '/design'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ]

  const isPasswordValid = passwordRequirements.every(req => req.met)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      setError('Please meet all password requirements')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${safeNext}`,
          data: {
            display_name: displayName.trim() || email.split('@')[0],
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.')
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
        // Confirmation email sent
        setConfirmationSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

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
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setConfirmationSent(false)
                    setEmail('')
                    setPassword('')
                    setDisplayName('')
                  }}
                  className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-teal-400 hover:text-teal-300"
                >
                  Use a different email
                </button>
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
                  href={`/sign-in${safeNext !== '/design' ? `?next=${encodeURIComponent(safeNext)}` : ''}`}
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
