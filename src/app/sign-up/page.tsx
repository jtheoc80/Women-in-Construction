import { Suspense } from 'react'
import { SignUpClient } from './sign-up-client'

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoading />}>
      <SignUpClient />
    </Suspense>
  )
}

function SignUpLoading() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-slate-950">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-center border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-lg">
        <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
      </header>
      <div className="flex flex-1 items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="space-y-4">
              <div className="h-8 w-56 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-72 animate-pulse rounded bg-white/10" />
              <div className="mt-6 space-y-4">
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
