import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'

interface ValidateInviteResult {
  id: string | null
  code: string | null
  inviter_user_id: string | null
  uses: number | null
  max_uses: number | null
  expires_at: string | null
  is_valid: boolean
}

const INVITE_CODE_COOKIE = 'invite_code'
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { code } = await params

  if (!code || typeof code !== 'string') {
    return <InvalidInvitePage reason="No invite code provided." />
  }

  // Validate the invite code server-side
  let isValid = false
  let reason = 'Invalid invite code.'

  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .rpc('validate_invite_code', { p_code: code.trim() })
      .single<ValidateInviteResult>()

    if (error) {
      console.error('Error validating invite:', error)
      reason = 'Failed to validate invite code.'
    } else if (data && data.is_valid) {
      isValid = true
    } else if (data && data.id) {
      // Invite exists but is not valid
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        reason = 'This invite has expired.'
      } else if (data.max_uses !== null && data.uses !== null && data.uses >= data.max_uses) {
        reason = 'This invite has reached its maximum uses.'
      }
    }
  } catch (err) {
    console.error('Error validating invite:', err)
    reason = 'An error occurred while validating the invite.'
  }

  if (!isValid) {
    return <InvalidInvitePage reason={reason} />
  }

  // Valid invite - store in cookie and redirect
  const cookieStore = await cookies()
  cookieStore.set(INVITE_CODE_COOKIE, code, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SEVEN_DAYS_SECONDS,
    path: '/',
  })

  // Redirect to signup with invite code
  redirect(`/signup?invite=${encodeURIComponent(code)}`)
}

function InvalidInvitePage({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-xl font-semibold text-slate-900">
            Invite link invalid or expired
          </h1>
          
          <p className="mt-2 text-slate-600">
            {reason}
          </p>
          
          <div className="mt-6">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              Browse listings
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-slate-500">
            Ask your friend for a new invite link, or explore publicly available listings.
          </p>
        </div>
      </div>
    </main>
  )
}
