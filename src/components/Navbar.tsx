'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  onPostListing?: () => void
  showPostButton?: boolean
}

export function Navbar({ onPostListing, showPostButton = true }: NavbarProps) {
  const { user, profile, loading, signOut } = useAuth()
  const pathname = usePathname()

  // Avoid useSearchParams here to keep pages pre-renderable.
  const currentUrl = pathname

  const initials = (() => {
    const name = (profile?.display_name || '').trim()
    if (!name) return 'U'
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || 'U'
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
    return (first + (second || '')).toUpperCase()
  })()

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

              <details className="relative">
                <summary className="list-none cursor-pointer select-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
                    {initials}
                  </div>
                </summary>
                <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-lg">
                  <Link
                    href="/account"
                    className="block px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  >
                    My profile
                  </Link>
                  <Link
                    href="/inbox"
                    className="block px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                  >
                    Inbox
                  </Link>
                  <button
                    onClick={signOut}
                    className="block w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              </details>
            </div>
          ) : (
            <Button
              asChild
              className="border border-white/20 bg-white/10 text-sm text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Link href={`/signup?next=${encodeURIComponent(currentUrl)}`}>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
