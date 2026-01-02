'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { BrandMark } from '@/components/BrandMark'
import { Mail, Lock, Loader2 } from 'lucide-react'

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

  if (magicLinkSent) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-md px-4 py-12">
          <div className="mb-8 flex items-center justify-center gap-2">
            <BrandMark />
            <span className="text-xl font-bold tracking-tight text-slate-900">SiteSisters</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <Mail className="h-6 w-6 text-teal-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Check your email</h1>
            <p className="mt-2 text-slate-600">
              We sent a magic link to <strong>{email}</strong>. Click the link in your email to sign in.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false)
                setEmail('')
              }}
              className="mt-6 text-sm text-teal-600 hover:text-teal-700"
            >
              Use a different email
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="mb-8 flex items-center justify-center gap-2">
          <BrandMark />
          <span className="text-xl font-bold tracking-tight text-slate-900">SiteSisters</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-slate-600">
            Welcome back! Enter your credentials to continue.
          </p>

          {mode === 'password' ? (
            <form onSubmit={handleSignInWithPassword} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full bg-teal-600 hover:bg-teal-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignInWithMagicLink} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email" className="text-slate-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-teal-600 hover:bg-teal-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send magic link'
                )}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'password' ? 'magic' : 'password')
                setError(null)
              }}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {mode === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                href={`/sign-up${safeNext !== '/design' ? `?next=${encodeURIComponent(safeNext)}` : ''}`}
                className="font-medium text-teal-600 hover:text-teal-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your email is never shown publicly.
        </p>
      </div>
    </main>
  )
}
