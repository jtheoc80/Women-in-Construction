import { Suspense } from 'react'
import { SignupClient } from './signup-client'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignupClient />
    </Suspense>
  )
}

