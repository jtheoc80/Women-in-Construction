import { Suspense } from 'react'
import { SignInClient } from './sign-in-client'

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignInClient />
    </Suspense>
  )
}

