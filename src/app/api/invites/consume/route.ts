import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * POST /api/invites/consume
 * Called after successful OTP signup to record invite usage.
 * Requires authenticated user.
 * 
 * Request body:
 * - code: string - The invite code to consume
 * 
 * Validation:
 * - Invite must exist
 * - Invite must not be expired
 * - max_uses is null OR uses < max_uses
 * - Prevents self-referral (inviter_user_id != auth.uid())
 * 
 * Behavior:
 * - If already used by this user, returns ok: true (idempotent)
 * - Inserts invite_uses row
 * - Atomically increments invites.uses only when new row created
 * 
 * Response:
 * - { ok: true } if invite was consumed successfully
 * - { ok: false, reason: string } if consumption failed
 */
export async function POST(req: NextRequest) {
  try {
    // First, verify the user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, reason: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Parse the request body
    let code: string
    try {
      const body = await req.json()
      code = body.code
    } catch {
      return NextResponse.json(
        { ok: false, reason: 'Invalid request body.' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { ok: false, reason: 'No invite code provided.' },
        { status: 400 }
      )
    }

    // Use admin client to consume the invite (bypasses RLS)
    const adminClient = createAdminClient()

    // Call the consume_invite function which handles:
    // - Validation (exists, not expired, not maxed out)
    // - Self-referral prevention
    // - Idempotent insert into invite_uses
    // - Atomic increment of invites.uses
    const { data, error } = await adminClient
      .rpc('consume_invite', { 
        p_code: code.trim(), 
        p_user_id: user.id 
      })

    if (error) {
      console.error('Error consuming invite:', error)
      return NextResponse.json(
        { ok: false, reason: 'Failed to consume invite.' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({
        ok: false,
        reason: 'Invite code is invalid, expired, or has reached its maximum uses.',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Unexpected error consuming invite:', error)
    return NextResponse.json(
      { ok: false, reason: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
