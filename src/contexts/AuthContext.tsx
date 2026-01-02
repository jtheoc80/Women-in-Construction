'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { usePathname, useRouter } from 'next/navigation'

export interface Profile {
  id: string
  display_name: string | null
  first_name: string | null
  home_city: string | null
  company: string | null
  role: string | null
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = getSupabaseBrowserClient()

  // Profile is complete if first_name and home_city are set
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
        .select('id, display_name, first_name, home_city, company, role, created_at, updated_at')
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
    router.push('/sign-in')
  }, [supabase, router])

  useEffect(() => {
    // Safety timeout to ensure loading state doesn't stay true forever
    const loadingTimeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

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
        clearTimeout(loadingTimeout)
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
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      clearTimeout(loadingTimeout)
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
export function useGatedAction() {
  const { user, isProfileComplete } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const currentUrl = pathname

  const gateAction = useCallback((action: () => void, nextUrl?: string) => {
    const desiredNext = nextUrl || currentUrl
    const safeNext = desiredNext.startsWith('/') ? desiredNext : '/'
    const encodedNext = encodeURIComponent(safeNext)

    if (!user) {
      router.push(`/sign-in?next=${encodedNext}`)
      return false
    }

    if (!isProfileComplete) {
      router.push(`/account?onboarding=1&next=${encodedNext}`)
      return false
    }

    action()
    return true
  }, [user, isProfileComplete, router, currentUrl])

  return { gateAction, isAuthed: !!user, isProfileComplete }
}
