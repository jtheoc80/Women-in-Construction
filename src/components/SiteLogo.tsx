import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * SiteSisters Logo - SVG icon representing women in construction
 * A stylized hardhat/house silhouette in teal
 */
function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hardhat shape */}
      <path
        d="M6 20C6 14.4772 10.4772 10 16 10C21.5228 10 26 14.4772 26 20V22H6V20Z"
        fill="#0D9488"
      />
      {/* Hardhat brim */}
      <rect x="4" y="21" width="24" height="3" rx="1.5" fill="#0D9488" />
      {/* House/door shape in center */}
      <path
        d="M13 22V17L16 14L19 17V22H13Z"
        fill="white"
      />
      {/* Hardhat ridge */}
      <rect x="14" y="8" width="4" height="3" rx="1" fill="#0D9488" />
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

  return (
    <span
      className={cn(
        'relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-black/10',
        className
      )}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <LogoSvg className="h-6 w-6" />
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

