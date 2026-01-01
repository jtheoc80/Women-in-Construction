'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading, refreshProfile, isProfileComplete } = useAuth()
  
  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [homeCity, setHomeCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()
  const nextUrl = searchParams.get('next') || '/design'

  // Pre-fill with existing profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastInitial(profile.last_initial || '')
      setHomeCity(profile.home_city || '')
    }
  }, [profile])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/signup?next=${encodeURIComponent(nextUrl)}`)
    }
  }, [user, authLoading, router, nextUrl])

  // Redirect if profile is already complete
  useEffect(() => {
    if (!authLoading && user && isProfileComplete) {
      router.push(nextUrl)
    }
  }, [user, authLoading, isProfileComplete, router, nextUrl])

  const generateDisplayName = (first: string, lastInit: string) => {
    if (!first) return ''
    const trimmedFirst = first.trim()
    const trimmedLast = lastInit.trim().charAt(0).toUpperCase()
    return trimmedLast ? `${trimmedFirst} ${trimmedLast}.` : trimmedFirst
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    const displayName = generateDisplayName(firstName, lastInitial)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName.trim(),
          last_initial: lastInitial.trim().charAt(0).toUpperCase() || null,
          display_name: displayName,
          home_city: homeCity.trim(),
          updated_at: new Date().toISOString(),
        })

      if (updateError) {
        console.error('Profile update error:', updateError)
        setError(updateError.message)
      } else {
        await refreshProfile()
        router.push(nextUrl)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayNamePreview = generateDisplayName(firstName, lastInitial)

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/design" className="flex items-center gap-2 w-fit">
            <span className="text-2xl">🏠</span>
            <span className="text-white text-xl font-bold">SiteSisters</span>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-12 lg:py-20">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="w-12 h-1 bg-orange-500 rounded"></div>
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
            </div>
            <p className="text-center text-sm text-slate-500">
              Step 2 of 2: Complete your profile
            </p>
          </div>

          <Card className="bg-white shadow-lg border-slate-200">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">
                Complete your profile
              </CardTitle>
              <CardDescription className="text-slate-600">
                Tell us a bit about yourself so other tradeswomen can find you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700">
                      First name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Sarah"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoFocus
                      className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastInitial" className="text-slate-700">
                      Last initial <span className="text-slate-400">(optional)</span>
                    </Label>
                    <Input
                      id="lastInitial"
                      type="text"
                      placeholder="M"
                      maxLength={1}
                      value={lastInitial}
                      onChange={(e) => setLastInitial(e.target.value)}
                      className="h-11 w-20 border-slate-300 focus:border-orange-500 focus:ring-orange-500 uppercase"
                    />
                    <p className="text-sm text-slate-500">
                      Your display name will be: <strong className="text-slate-700">{displayNamePreview || 'Your Name'}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeCity" className="text-slate-700">
                      Home base city <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="homeCity"
                      type="text"
                      placeholder="Phoenix, AZ"
                      value={homeCity}
                      onChange={(e) => setHomeCity(e.target.value)}
                      required
                      className="h-11 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <p className="text-xs text-slate-500">
                      Where you&apos;re currently based or looking for housing
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="text-xl">🔒</span>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-700 mb-1">Your privacy is protected</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Your email and phone are <strong>never</strong> shown publicly</li>
                        <li>• Contact info is only shared after mutual intro acceptance</li>
                        <li>• Only your display name and city appear on listings</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !firstName.trim() || !homeCity.trim()}
                  className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500">
            You can update your profile anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
