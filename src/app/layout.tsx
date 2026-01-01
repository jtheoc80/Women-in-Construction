import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Women in Construction - Find Your Roommate',
  description: 'A community platform helping women in construction find compatible roommates in their city.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
