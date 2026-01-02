import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

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
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
