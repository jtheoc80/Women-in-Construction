'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { BrandMark } from '@/components/BrandMark'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  const next = searchParams.get('next') || '/design'
  const safeNext = next.startsWith('/') ? next : '/design'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again or sign up for a new account.')
        } else {
          setError(signInError.message)
        }
        return
      }

      router.push(safeNext)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleSignInWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${safeNext}`,
        },
      })

      if (otpError) {
        setError(otpError.message)
        return
      }

      setMagicLinkSent(true)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/sign-in`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setMagicLinkSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-slate-950">
        {/* Header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-center border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-lg">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
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
                Click the link in your email to continue.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false)
                  setEmail('')
                }}
                className="mt-6 min-h-[44px] rounded-xl px-4 text-sm font-medium text-teal-400 hover:text-teal-300"
              >
                Use a different email
              </button>
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
          <BrandMark />
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

            {mode === 'password' ? (
              <form onSubmit={handleSignInWithPassword} className="mt-6 space-y-5 sm:mt-8">
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
              <form onSubmit={handleSignInWithMagicLink} className="mt-6 space-y-5 sm:mt-8">
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
                  setMode(mode === 'password' ? 'magic' : 'password')
                  setError(null)
                }}
                className="min-h-[44px] px-4 text-sm text-white/60 hover:text-white/90"
              >
                {mode === 'password' ? 'Sign in with magic link' : 'Sign in with password'}
              </button>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-white/60">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/sign-up${safeNext !== '/design' ? `?next=${encodeURIComponent(safeNext)}` : ''}`}
                  className="min-h-[44px] font-semibold text-teal-400 hover:text-teal-300"
                >
                  Sign up
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
