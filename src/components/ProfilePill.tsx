'use client'

import * as React from 'react'
import { SiteSistersMark } from '@/components/SiteSistersMark'

export type LocalProfile = {
  displayName: string
  company: string
  role?: string
}

function formatSecondaryLine(profile: LocalProfile) {
  const company = profile.company.trim()
  const role = (profile.role || '').trim()
  return role ? `${company} • ${role}` : company
}

export function ProfilePill({
  profile,
  onEditProfile,
  onGoToListings,
  onSafety,
}: {
  profile: LocalProfile
  onEditProfile: () => void
  onGoToListings: () => void
  onSafety: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-3 rounded-2xl bg-white/10 px-3 text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
          <SiteSistersMark className="h-5 w-5" />
        </span>

        <span className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="truncate text-sm font-semibold leading-tight text-white">
            {profile.displayName}
          </span>
          <span className="truncate text-xs text-white/70">
            {formatSecondaryLine(profile)}
          </span>
        </span>

        <span className="ml-0.5 text-xs text-white/80" aria-hidden="true">
          ▼
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-lg backdrop-blur"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
            onClick={() => {
              setOpen(false)
              onEditProfile()
            }}
          >
            Edit profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
            onClick={() => {
              setOpen(false)
              onGoToListings()
            }}
          >
            My listings
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
            onClick={() => {
              setOpen(false)
              onSafety()
            }}
          >
            Safety
          </button>
        </div>
      )}
    </div>
  )
}

