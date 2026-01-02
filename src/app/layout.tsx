import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

// Use NEXT_PUBLIC_SITE_URL for metadataBase to support custom domains
// Falls back to production domain if not set
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sitesistersconstruction.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SiteSisters - Roommates Who Get the Jobsite Schedule',
  description: 'Women-first roommate matching for construction & data center projects. No public contact info. Intros by request.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
