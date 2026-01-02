import { Suspense } from 'react'
import { SignInClient } from './sign-in-client'

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInClient />
    </Suspense>
  )
}

function SignInLoading() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-slate-950">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="text-white/60">Loading...</div>
      </div>
    </main>
  )
}
