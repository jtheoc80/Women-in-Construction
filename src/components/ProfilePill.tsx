'use client'

import * as React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronDown, User, Inbox, LogOut, Settings, Link2 } from 'lucide-react'
import { InviteDialog } from '@/components/InviteDialog'

// Legacy type for localStorage profiles (being removed)
export type LocalProfile = {
  displayName: string
  company: string
  role?: string
}

export function ProfilePill() {
  const { user, profile, loading, signOut } = useAuth()
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    function onPointerDown(e: MouseEvent | PointerEvent) {
      const root = rootRef.current
      if (!root) return
      if (e.target instanceof Node && !root.contains(e.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  // Loading state
  if (loading) {
    return (
      <div className="h-11 w-11 animate-pulse rounded-full bg-white/10 sm:w-32" />
    )
  }

  // Not authenticated - show sign in button
  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <span className="hidden sm:inline">Sign in</span>
        <User className="h-5 w-5 sm:hidden" />
      </Link>
    )
  }

  // Get initials
  const displayName = profile?.display_name || profile?.first_name || 'User'
  const initials = (() => {
    const name = displayName.trim()
    if (!name) return 'U'
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || 'U'
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
    return (first + (second || '')).toUpperCase()
  })()

  const homeCity = profile?.home_city

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 min-w-[44px] items-center gap-2 rounded-2xl bg-white/10 px-2 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:gap-3 sm:px-3"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white ring-1 ring-white/20">
          {initials}
        </span>

        {/* Name - hidden on very small screens, single line on mobile */}
        <span className="hidden min-w-0 max-w-[120px] flex-col text-left sm:flex">
          <span className="truncate text-sm font-semibold leading-tight text-white">
            {displayName}
          </span>
          {homeCity && (
            <span className="truncate text-xs text-white/60">
              {homeCity}
            </span>
          )}
        </span>

        {/* Chevron */}
        <ChevronDown 
          className={`h-4 w-4 flex-shrink-0 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-xl backdrop-blur"
        >
          {/* Profile info header */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            {homeCity && (
              <p className="truncate text-xs text-white/60">{homeCity}</p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/account"
              role="menuitem"
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 text-white/60" />
              My profile
            </Link>
            
            <Link
              href="/inbox"
              role="menuitem"
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <Inbox className="h-4 w-4 text-white/60" />
              Inbox
            </Link>

            <InviteDialog
              trigger={
                <button
                  role="menuitem"
                  className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  <Link2 className="h-4 w-4 text-white/60" />
                  Invite friends
                </button>
              }
            />
          </div>

          {/* Sign out */}
          <div className="border-t border-white/10 py-1">
            <button
              type="button"
              role="menuitem"
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              onClick={() => {
                setOpen(false)
                signOut()
              }}
            >
              <LogOut className="h-4 w-4 text-white/60" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Authenticated profile pill specifically for the design page header
export function AuthProfilePill() {
  return <ProfilePill />
}
