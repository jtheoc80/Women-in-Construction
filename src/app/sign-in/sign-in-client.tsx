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

export function SignInClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  const nextParam = useMemo(() => safeNextParam(searchParams.get('next')), [searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Signed in, but could not load your session. Please refresh and try again.')
        return
      }

      // Ensure a profile row exists for this auth user
      await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name,company,role')
        .eq('id', user.id)
        .single()

      const isProfileComplete = Boolean(profile?.display_name?.trim() && profile?.company?.trim())
      if (!isProfileComplete) {
        router.replace(`/profile?onboarding=1&next=${encodeURIComponent(nextParam || '/design')}`)
        return
      }

      router.replace(nextParam || '/design')
    } catch (err) {
      console.error('Sign-in error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-2 text-slate-600">Use your email and password.</p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSignIn} className="space-y-4">
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading || !email.trim() || !password} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New here?{' '}
            <Link href="/sign-up" className="font-medium text-slate-900 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

