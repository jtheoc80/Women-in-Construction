'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

function safeNextParam(nextParam: string | null): string | null {
  if (!nextParam) return null
  return nextParam.startsWith('/') ? nextParam : null
}

export function SignUpClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  const nextParam = useMemo(() => safeNextParam(searchParams.get('next')), [searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmation is enabled, there may be no session yet.
      if (!data.session) {
        setMessage('Check your email to confirm your account, then come back to sign in.')
        return
      }

      const userId = data.user?.id
      if (userId) {
        await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' })
      }

      router.replace(`/profile?onboarding=1&next=${encodeURIComponent(nextParam || '/design')}`)
    } catch (err) {
      console.error('Sign-up error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-2 text-slate-600">Use your email and password.</p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">Use at least 8 characters.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && !error && <p className="text-sm text-emerald-700">{message}</p>}

            <Button type="submit" disabled={loading || !email.trim() || !password} className="w-full">
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

