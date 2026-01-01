import * as React from 'react'
import { cn } from '@/lib/utils'

export function BrandMark({
  className,
  label = 'SiteSisters',
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15',
        className
      )}
      role="img"
      aria-label={label}
    >
      <span className="text-[11px] font-semibold tracking-tight">SS</span>
    </span>
  )
}

