import * as React from 'react'
import { cn } from '@/lib/utils'

export function SiteSistersMark({
  className,
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-7 w-7', className)}
      aria-hidden="true"
    >
      {/* Hair background - flowing waves */}
      <path
        d="M5 17C4 19 3.5 22 4 25C4.5 27.5 6 28.5 7 27.5C7.5 27 7.5 25 8 23C8.5 21 9 19 9 17"
        fill="#B91C1C"
      />
      <path
        d="M8 17C7.5 20 7 23 7.5 26C8 28 9.5 28.5 10.5 27.5C11 27 11 25 11.5 22C11.7 20 12 18 12 17"
        fill="#DC2626"
      />
      <path
        d="M11 17C11 20 10.5 23 11 26C11.5 28.5 13 29 14 28C14.5 27.5 14.5 25 15 22C15.3 20 15.5 18 15.5 17"
        fill="#B91C1C"
      />
      <path
        d="M15 17C15 20 15 23 15.5 26C16 28.5 17.5 29 18.5 28C19 27.5 18.5 25 18 22C17.7 20 17 18 17 17"
        fill="#DC2626"
      />
      <path
        d="M17 17C17.5 20 18 23 17.5 26C17 28 18 29 19.5 28C20.5 27 21 25 21.5 22C21.8 20 22 18 22 17"
        fill="#B91C1C"
      />
      <path
        d="M21 17C21.5 20 22.5 23 22 26C21.5 28 23 29 24.5 28C25.5 27 25.5 25 25 22C24.7 20 24 18 24 17"
        fill="#DC2626"
      />
      <path
        d="M23 17C24 19 25 22 25 25C25 27.5 26.5 28 27.5 27C28.5 26 28 24 27.5 21C27 19 26 17 26 17"
        fill="#B91C1C"
      />
      
      {/* Hard hat dome - main shape */}
      <path
        d="M5.5 15.5C5.5 9.7 10.2 5 16 5C21.8 5 26.5 9.7 26.5 15.5H5.5Z"
        fill="#FBBF24"
      />
      
      {/* Hard hat dome highlight */}
      <path
        d="M8 14C8 10 11.6 7 16 7C17.5 7 18.9 7.4 20 8"
        stroke="#FDE68A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Hard hat dome shadow/depth */}
      <path
        d="M7 15C7 10.5 11 7 16 7C21 7 25 10.5 25 15"
        stroke="#F59E0B"
        strokeWidth="0.5"
        fill="none"
      />
      
      {/* Hard hat brim */}
      <path
        d="M3 15C3 13.9 3.9 13 5 13H27C28.1 13 29 13.9 29 15C29 16.6 27.6 18 26 18H6C4.4 18 3 16.6 3 15Z"
        fill="#FBBF24"
      />
      
      {/* Brim top edge highlight */}
      <path
        d="M5 13.5H27"
        stroke="#FDE68A"
        strokeWidth="1"
        strokeLinecap="round"
      />
      
      {/* Brim shadow */}
      <path
        d="M6 17.5C7 17.8 11 18 16 18C21 18 25 17.8 26 17.5"
        stroke="#D97706"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Center front vent/detail */}
      <rect x="14" y="8" width="4" height="5" rx="1" fill="#F59E0B" />
      <rect x="14.5" y="8.5" width="3" height="4" rx="0.5" fill="#FBBF24" />
      
      {/* Top ridge detail */}
      <path
        d="M16 5V8"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
