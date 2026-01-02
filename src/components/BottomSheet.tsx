'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Full height on mobile (useful for multi-step forms) */
  fullHeight?: boolean
  /** Show close button */
  showCloseButton?: boolean
  /** Additional className for the content container */
  className?: string
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  fullHeight = false,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Focus trap
  React.useEffect(() => {
    if (!open || !contentRef.current) return

    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    window.addEventListener('keydown', handleTab)
    firstElement?.focus()

    return () => window.removeEventListener('keydown', handleTab)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Bottom sheet'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          'relative w-full bg-slate-900 shadow-2xl',
          // Mobile: bottom sheet with rounded top
          'max-h-[90dvh] rounded-t-3xl',
          // Desktop: centered modal
          'sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl',
          fullHeight && 'h-[90dvh] sm:h-auto sm:max-h-[85vh]',
          className
        )}
      >
        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-4 sm:px-6">
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn(
          'overflow-y-auto',
          fullHeight ? 'flex-1' : 'max-h-[calc(90dvh-80px)] sm:max-h-[calc(85vh-80px)]'
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Slide-over drawer variant (right side on desktop, bottom on mobile)
interface SlideOverProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function SlideOver({
  open,
  onClose,
  title,
  children,
  className,
}: SlideOverProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Slide over'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content - Bottom sheet on mobile, right drawer on desktop */}
      <div
        ref={contentRef}
        className={cn(
          'absolute bg-slate-900 shadow-2xl',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl',
          // Desktop: right drawer
          'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:rounded-l-2xl',
          className
        )}
      >
        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-4 sm:px-6">
          {title && (
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="h-[calc(90dvh-80px)] overflow-y-auto sm:h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
