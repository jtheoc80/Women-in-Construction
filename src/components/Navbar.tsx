'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'

interface NavbarProps {
  onPostListing?: () => void
  showPostButton?: boolean
}

export function Navbar({ onPostListing, showPostButton = true }: NavbarProps) {
  const { user, profile, loading, signOut, openAuthDialog } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950 px-4 py-4 text-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/design" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            SiteSisters
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          {showPostButton && (
            <Button
              onClick={onPostListing}
              className="bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 sm:px-5 sm:text-base"
            >
              <span className="hidden sm:inline">+ Post Listing</span>
              <span className="sm:hidden">+ Post</span>
            </Button>
          )}

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded bg-white/10" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-xs text-white/60">
                  {profile?.home_city || 'Complete profile'}
                </p>
              </div>
              <Button
                onClick={signOut}
                className="border border-white/20 bg-white/10 text-sm text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              onClick={openAuthDialog}
              className="border border-white/20 bg-white/10 text-sm text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
