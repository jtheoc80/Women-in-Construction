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

  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '')
  const [company, setCompany] = useState(initialProfile?.company || '')
  const [role, setRole] = useState(initialProfile?.role || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isCompletePreview = useMemo(() => {
    return Boolean(displayName.trim() && company.trim())
  }, [displayName, company])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent('/profile')}`)
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const payload = {
        display_name: displayName.trim() || null,
        company: company.trim() || null,
        role: role.trim() || null,
      }

      const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await refreshProfile()
      setSaved(true)

      if (onboarding && isCompletePreview && nextParam) {
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
            Please complete your profile to access the app.
          </p>
        )}

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-slate-700">
              Display name *
            </Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Sarah M."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-slate-700">
              Company *
            </Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Turner Construction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700">
              Role / title
            </Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Electrician"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && !error && (
            <p className="text-sm text-emerald-700">Saved.</p>
          )}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving…' : onboarding ? 'Save & continue' : 'Save'}
          </Button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          This is what other members see on your listings.
        </p>
      </div>
    </form>
  )
}

