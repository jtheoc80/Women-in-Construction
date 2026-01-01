'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/AuthCard'

function LoginContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/design" className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="text-white text-xl font-bold">SiteSisters</span>
          </Link>
          <Link 
            href="/signup" 
            className="text-sm text-slate-300 hover:text-white"
          >
            Create account
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center px-4 py-12 lg:py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              Welcome back
            </h1>
            <p className="text-slate-600">
              Sign in to manage your listings and connect with roommates.
            </p>
          </div>

          <AuthCard mode="login" />

          <div className="mt-8 text-center space-y-4">
            <p className="text-slate-600 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign up free
              </Link>
            </p>
            
            <Link 
              href="/design" 
              className="inline-block text-sm text-slate-500 hover:text-slate-700"
            >
              ← Continue browsing without signing in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
