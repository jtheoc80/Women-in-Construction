'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/AuthCard'

function TrustBadge({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function SignupContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-800 px-4 py-4">
        <Link href="/design" className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="text-white text-xl font-bold">SiteSisters</span>
        </Link>
      </header>

      <div className="flex min-h-screen lg:min-h-screen">
        {/* Left Side - Value Prop (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-12 flex-col justify-between">
          <div>
            <Link href="/design" className="flex items-center gap-3 mb-16">
              <span className="text-4xl">🏠</span>
              <span className="text-white text-2xl font-bold tracking-tight">SiteSisters</span>
            </Link>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Find roommates who get your schedule.
            </h1>
            <p className="text-xl text-slate-300 mb-12 leading-relaxed">
              Women-first roommate matching for construction & data center projects. 
              Connect safely with verified tradeswomen near your jobsite.
            </p>

            <div className="space-y-8">
              <TrustBadge
                icon="🔒"
                title="Privacy-First"
                description="Your email and phone are never shown publicly. Contact info is only shared when both parties accept an intro."
              />
              <TrustBadge
                icon="🤝"
                title="Request-to-Connect"
                description="No cold messages. Send intro requests with a personal message, and connect only when there's mutual interest."
              />
              <TrustBadge
                icon="🛡️"
                title="Community Moderation"
                description="Our team reviews reports quickly. Fake listings and bad actors are removed to keep the community safe."
              />
              <TrustBadge
                icon="👷‍♀️"
                title="Built for Tradeswomen"
                description="Understand shift work, per diem life, and what it's like to relocate for a project. We get it."
              />
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Auth Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
          <div className="w-full max-w-md">
            {/* Mobile value prop */}
            <div className="lg:hidden mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-3">
                Join SiteSisters
              </h1>
              <p className="text-slate-600">
                Women-first roommate matching for construction projects. 
                Find safe, affordable housing near your jobsite.
              </p>
            </div>

            <AuthCard mode="signup" />

            {/* Mobile trust badges */}
            <div className="lg:hidden mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="text-lg">🔒</span>
                <span>Your contact info stays private until you both accept</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="text-lg">🛡️</span>
                <span>Moderated community keeps everyone safe</span>
              </div>
            </div>

            {/* Mobile sign in link */}
            <div className="lg:hidden mt-8 text-center">
              <p className="text-slate-600 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Back to browse link */}
            <div className="mt-6 text-center">
              <Link 
                href="/design" 
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Continue browsing without an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
