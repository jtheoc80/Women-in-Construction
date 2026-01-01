'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export interface Profile {
  id: string
  display_name: string | null
  first_name: string | null
  last_initial: string | null
  home_city: string | null
  organization_id: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isProfileComplete: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  openAuthDialog: () => void
  openProfileSheet: () => void
  setAuthDialogOpen: (open: boolean) => void
  setProfileSheetOpen: (open: boolean) => void
  authDialogOpen: boolean
  profileSheetOpen: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)

  const supabase = getSupabaseBrowserClient()

  const isProfileComplete = Boolean(
    profile?.first_name && 
    profile.first_name.trim() !== '' && 
    profile?.home_city && 
    profile.home_city.trim() !== ''
  )

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile might not exist yet, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: userId })
            .select()
            .single()

          if (!createError && newProfile) {
            setProfile(newProfile)
            return newProfile
          }
        }
        console.error('Error fetching profile:', error)
        return null
      }

      setProfile(data)
      return data
    } catch (err) {
      console.error('Error in fetchProfile:', err)
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [supabase])

  const openAuthDialog = useCallback(() => {
    setAuthDialogOpen(true)
  }, [])

  const openProfileSheet = useCallback(() => {
    setProfileSheetOpen(true)
  }, [])

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)
          await fetchProfile(initialSession.user.id)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id)
          
          // If user just signed in and profile is incomplete, open profile sheet
          if (event === 'SIGNED_IN' && profileData) {
            const isComplete = Boolean(
              profileData.first_name && 
              profileData.first_name.trim() !== '' && 
              profileData.home_city && 
              profileData.home_city.trim() !== ''
            )
            if (!isComplete) {
              setAuthDialogOpen(false)
              setProfileSheetOpen(true)
            } else {
              setAuthDialogOpen(false)
            }
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isProfileComplete,
    signOut,
    refreshProfile,
    openAuthDialog,
    openProfileSheet,
    setAuthDialogOpen,
    setProfileSheetOpen,
    authDialogOpen,
    profileSheetOpen,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for gating actions behind auth + profile completion
// Supports both modal-based (default) and redirect-based gating
export function useGatedAction(options?: { useRedirect?: boolean }) {
  const { user, isProfileComplete, openAuthDialog, openProfileSheet } = useAuth()

  const gateAction = useCallback((action: () => void, returnUrl?: string) => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/design'
    const redirectUrl = returnUrl || currentUrl

    if (!user) {
      if (options?.useRedirect) {
        window.location.href = `/signup?next=${encodeURIComponent(redirectUrl)}`
      } else {
        openAuthDialog()
      }
      return false
    }
    
    if (!isProfileComplete) {
      if (options?.useRedirect) {
        window.location.href = `/onboarding?next=${encodeURIComponent(redirectUrl)}`
      } else {
        openProfileSheet()
      }
      return false
    }
    
    action()
    return true
  }, [user, isProfileComplete, openAuthDialog, openProfileSheet, options?.useRedirect])

  // Helper to get the signup URL with return path
  const getSignupUrl = useCallback((returnUrl?: string) => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/design'
    const redirectUrl = returnUrl || currentUrl
    return `/signup?next=${encodeURIComponent(redirectUrl)}`
  }, [])

  // Helper to get the onboarding URL with return path
  const getOnboardingUrl = useCallback((returnUrl?: string) => {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/design'
    const redirectUrl = returnUrl || currentUrl
    return `/onboarding?next=${encodeURIComponent(redirectUrl)}`
  }, [])

  return { 
    gateAction, 
    isAuthed: !!user, 
    isProfileComplete,
    getSignupUrl,
    getOnboardingUrl,
  }
}
