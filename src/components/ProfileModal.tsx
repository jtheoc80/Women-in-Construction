'use client'

import * as React from 'react'
import type { LocalProfile } from '@/components/ProfilePill'

export function ProfileModal({
  open,
  initialProfile,
  onClose,
  onSave,
}: {
  open: boolean
  initialProfile: LocalProfile | null
  onClose: () => void
  onSave: (profile: LocalProfile) => void
}) {
  const [displayName, setDisplayName] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')

  React.useEffect(() => {
    if (!open) return
    setDisplayName(initialProfile?.displayName || '')
    setCompany(initialProfile?.company || '')
    setRole(initialProfile?.role || '')
  }, [open, initialProfile])

  React.useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const canSave = displayName.trim() !== '' && company.trim() !== ''

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
            <p className="mt-1 text-sm text-white/70">
              This is stored on this device (no auth).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSave) return
            onSave({
              displayName: displayName.trim(),
              company: company.trim(),
              role: role.trim() ? role.trim() : undefined,
            })
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-white/80">
              Display name <span className="text-red-300">*</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Sarah M."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-white/80">
              Company <span className="text-red-300">*</span>
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Turner Construction"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-white/80">
              Role (optional)
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-white ring-1 ring-white/10 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Electrician"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="h-10 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

