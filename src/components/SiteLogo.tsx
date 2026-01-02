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
  return (
    <Image
      src="/logo.png"
      alt={title || 'SiteSisters'}
      width={64}
      height={64}
      className={cn('h-7 w-7 object-contain', className)}
    />
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
        'inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/10',
        className
      )}
      role="img"
      aria-label={label}
    >
      <Image
        src="/logo.png"
        alt={label}
        width={128}
        height={128}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  )
}

