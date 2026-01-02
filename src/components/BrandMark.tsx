import * as React from 'react'
import { cn } from '@/lib/utils'
import { SiteSistersMark } from '@/components/SiteSistersMark'

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
        'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10',
        className
      )}
      role="img"
      aria-label={label}
    >
      <SiteSistersMark className="h-7 w-7" />
    </span>
  )
}

