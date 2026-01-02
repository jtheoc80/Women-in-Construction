'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth, type Profile } from '@/contexts/AuthContext'

function safeNextParam(nextParam: string | null): string | null {
  if (!nextParam) return null
  return nextParam.startsWith('/') ? nextParam : null
}

export function AccountProfileForm({ initialProfile }: { initialProfile: Profile | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const onboarding = searchParams.get('onboarding') === '1'
  const nextParam = useMemo(() => safeNextParam(searchParams.get('next')), [searchParams])

  const supabase = getSupabaseBrowserClient()
  const { user, refreshProfile } = useAuth()

  const [firstName, setFirstName] = useState(initialProfile?.first_name || '')
  const [homeCity, setHomeCity] = useState(initialProfile?.home_city || '')
  const [company, setCompany] = useState(initialProfile?.company || '')
  const [role, setRole] = useState(initialProfile?.role || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const displayNamePreview = useMemo(() => {
    const first = firstName.trim()
    return first || 'New user'
  }, [firstName])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent('/account')}`)
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const payload = {
        first_name: firstName.trim() || null,
        home_city: homeCity.trim() || null,
        company: company.trim() || null,
        role: role.trim() || null,
        display_name: (firstName.trim() || 'New user').trim(),
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await refreshProfile()
      setSaved(true)

      const complete = Boolean(payload.first_name && payload.home_city)
      if (onboarding && complete && nextParam) {
        router.replace(nextParam)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-6 space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        {onboarding && (
          <p className="mt-1 text-sm text-slate-600">
            Please complete your profile to post listings and request intros.
          </p>
        )}

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-slate-700">
              First name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Sarah"
              className="h-12 text-base"
            />
            <p className="text-xs text-slate-500">
              Display name: <strong className="text-slate-700">{displayNamePreview}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="home_city" className="text-slate-700">
              Home base city <span className="text-red-500">*</span>
            </Label>
            <Input
              id="home_city"
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              placeholder="Phoenix, AZ"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-slate-700">
              Company
            </Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Turner Construction"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700">
              Role / Title
            </Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Electrician, Site Supervisor, etc."
              className="h-12 text-base"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && !error && (
            <p className="text-sm text-emerald-700">Saved.</p>
          )}

          <Button 
            type="submit" 
            disabled={saving} 
            className="h-12 w-full bg-teal-600 text-base font-semibold hover:bg-teal-500"
          >
            {saving ? 'Saving…' : onboarding ? 'Save & continue' : 'Save'}
          </Button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Your email/phone are never shown publicly.
        </p>
      </div>
    </form>
  )
}
