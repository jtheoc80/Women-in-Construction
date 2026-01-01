import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthDialog } from '@/components/AuthDialog'
import { CompleteProfileSheet } from '@/components/CompleteProfileSheet'

export const metadata: Metadata = {
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
          <AuthDialog />
          <CompleteProfileSheet />
        </AuthProvider>
      </body>
    </html>
  )
}
