'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  onPostListing?: () => void
  showPostButton?: boolean
}

export function Navbar({ onPostListing, showPostButton = true }: NavbarProps) {
  const { user, profile, loading, signOut, openAuthDialog } = useAuth()

  return (
    <header className="bg-slate-800 px-4 sm:px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a href="/design" className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">🏠</span>
          <span className="text-white text-xl sm:text-2xl font-bold tracking-tight">
            SiteSisters
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          {showPostButton && (
            <Button
              onClick={onPostListing}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base px-3 sm:px-5 py-2"
            >
              <span className="hidden sm:inline">+ Post Listing</span>
              <span className="sm:hidden">+ Post</span>
            </Button>
          )}

          {loading ? (
            <div className="w-20 h-9 bg-slate-700 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-white text-sm font-medium">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-slate-400 text-xs">
                  {profile?.home_city || 'Complete profile'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-sm"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={openAuthDialog}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white text-sm"
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
