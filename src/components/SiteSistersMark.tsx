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
      {/* Red hair flowing beneath */}
      <path
        d="M6 18C5 21 4.5 25 5 28C5.5 30 7 31 8 30C9 29 8.5 26 9 23C9.5 20 10.5 18 10.5 18"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 19C9.5 22 9.5 25 10 28C10.5 30 11.5 31 12.5 30.5"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 19C14 22 14.5 25.5 15 28C15.5 29.5 16.5 30 17 29"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 19C18.5 22 18.5 25 18 28C17.5 30 18.5 31 19.5 30.5"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22 19C22.5 22 23 25 23 28C23 30 24.5 31 25.5 30C26.5 29 26 26 25.5 23C25 20 24 18 24 18"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 18C27 21 27.5 24 27 27C26.5 29 25 30 24 29"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Hard hat dome */}
      <path
        d="M6 16C6 10.5 10.5 6 16 6C21.5 6 26 10.5 26 16H6Z"
        fill="#FCD34D"
        stroke="#F59E0B"
        strokeWidth="1"
      />
      
      {/* Hard hat brim */}
      <path
        d="M4 16C4 15 4.5 14 6 14H26C27.5 14 28 15 28 16C28 17 27.5 18 26 18H6C4.5 18 4 17 4 16Z"
        fill="#FCD34D"
        stroke="#F59E0B"
        strokeWidth="1"
      />
      
      {/* Hard hat ridge/detail */}
      <path
        d="M10 10C11 8 13.5 7 16 7C18.5 7 21 8 22 10"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Center front detail */}
      <rect x="14.5" y="9" width="3" height="5" rx="0.5" fill="#F59E0B" />
    </svg>
  )
}
