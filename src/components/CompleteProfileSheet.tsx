'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Lock } from 'lucide-react'

export function CompleteProfileSheet() {
  const { profileSheetOpen, setProfileSheetOpen, user, profile, refreshProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [homeCity, setHomeCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  // Pre-fill with existing profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastInitial(profile.last_initial || '')
      setHomeCity(profile.home_city || '')
    }
  }, [profile])

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
        setProfileSheetOpen(false)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const displayNamePreview = generateDisplayName(firstName, lastInitial)

  return (
    <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold text-slate-800">
            Complete Your Profile
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            Tell us a bit about yourself. This helps other tradeswomen find great roommates!
          </SheetDescription>
        </SheetHeader>

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
                className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastInitial" className="text-slate-700">
                Last initial (optional)
              </Label>
              <Input
                id="lastInitial"
                type="text"
                placeholder="M"
                maxLength={1}
                value={lastInitial}
                onChange={(e) => setLastInitial(e.target.value)}
                className="border-slate-300 focus:border-orange-500 focus:ring-orange-500 w-20"
              />
              <p className="text-xs text-slate-500">
                Your display name will be: <strong>{displayNamePreview || 'Your Name'}</strong>
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
                className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="text-xs text-slate-500">
                Where you&apos;re currently based or looking for housing
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p className="mb-2 flex items-center gap-2 font-medium text-slate-800">
              <Lock className="h-4 w-4 text-slate-600" aria-hidden="true" />
              Your privacy matters
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Your email and phone are <strong>never</strong> shown publicly</li>
              <li>• Contact info is only shared after mutual intro acceptance</li>
              <li>• Only your display name and city appear on listings</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || !firstName.trim() || !homeCity.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            You can update your profile anytime from your account settings.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
