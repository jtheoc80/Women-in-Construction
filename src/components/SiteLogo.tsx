'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function SiteLogoMark({
  className,
  title,
}: {
  className?: string
  title?: string
}) {
  const labelled = typeof title === 'string' && title.trim().length > 0
  const [imageFailed, setImageFailed] = React.useState(false)
  const fallbackText = 'SS'

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
        <span
          className="flex h-full w-full select-none items-center justify-center font-semibold tracking-tight text-slate-900"
          aria-hidden="true"
        >
          {fallbackText}
        </span>
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

