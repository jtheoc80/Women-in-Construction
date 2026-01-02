import { Suspense } from 'react'
import { SignUpClient } from './sign-up-client'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignUpClient />
    </Suspense>
  )
}

