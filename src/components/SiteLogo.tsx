'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

function SiteLogoSvgMark({ className, title }: { className?: string; title?: string }) {
  const labelled = typeof title === 'string' && title.trim().length > 0

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-7 w-7', className)}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <defs>
        <linearGradient id="ss-helmet" x1="18" y1="10" x2="46" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="0.35" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="ss-brim" x1="10" y1="30" x2="56" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F59E0B" />
          <stop offset="0.45" stopColor="#FBBF24" />
          <stop offset="1" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient id="ss-hair" x1="14" y1="34" x2="28" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#DC2626" />
          <stop offset="0.6" stopColor="#EF4444" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>

      <path
        d="M12 50c2-10 7-18 15-22 2-1 3-2 4-3-2 8 1 14 8 18 2 1 4 2 7 2-6 8-14 14-26 14-4 0-7-2-8-4z"
        fill="url(#ss-hair)"
      />
      <path
        d="M16 54c1-7 5-13 12-17 2-1 3-2 4-3-1 6 1 10 6 13 2 1 4 2 6 2-4 5-10 9-19 9-4 0-7-1-9-4z"
        fill="#B91C1C"
        opacity="0.85"
      />

      <path
        d="M34 22c-7 1-12 7-12 14 0 6 2 10 5 13 2 2 4 3 5 4 4 2 10 2 13-2 2-2 3-4 3-7 0-4-2-7-6-9l-4-2c-2-1-3-3-3-6 0-2 0-3-1-5z"
        fill="#0B1020"
      />

      <path
        d="M14 28c0-10 8-18 18-18s18 8 18 18H14z"
        fill="url(#ss-helmet)"
        stroke="#0B1020"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />

      <path
        d="M10 28c0-1.7 1.3-3 3-3h38c1.7 0 3 1.3 3 3 0 4.5-3.9 8-9 8H19c-5.1 0-9-3.5-9-8z"
        fill="url(#ss-brim)"
        stroke="#0B1020"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />

      <path
        d="M16 30c6 1 26 1 32 0"
        stroke="#0B1020"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M22 18c3-3 7-5 12-4"
        stroke="#FFF7ED"
        strokeOpacity="0.75"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="30.5" cy="16.2" rx="3.6" ry="2.1" fill="#FFF7ED" opacity="0.55" />
      <ellipse cx="37.5" cy="16.8" rx="3.1" ry="1.8" fill="#FFF7ED" opacity="0.4" />

      <path
        d="M32 10v8"
        stroke="#0B1020"
        strokeOpacity="0.25"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SiteLogoMark({
  className,
  title,
}: {
  className?: string
  title?: string
}) {
  const labelled = typeof title === 'string' && title.trim().length > 0
  const [imageFailed, setImageFailed] = React.useState(false)

  return (
    <span
      className={cn(
        'relative block h-7 w-7 overflow-hidden rounded-md bg-white ring-1 ring-black/10',
        className
      )}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {imageFailed ? (
        <SiteLogoSvgMark className="h-full w-full" title={title} />
      ) : (
        <Image
          src="/logo.png"
          alt={labelled ? title! : ''}
          fill
          sizes="28px"
          className="object-contain"
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  )
}

export function SiteLogo({
  className,
  label = 'SiteSisters',
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white ring-1 ring-black/10',
        className
      )}
      role="img"
      aria-label={label}
    >
      <SiteLogoMark className="h-10 w-10" title={label} />
    </span>
  )
}

