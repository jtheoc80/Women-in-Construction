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
 * Response:
 * - { success: true } if invite was consumed successfully
 * - { success: false, reason: string } if consumption failed
 */
export async function POST(req: NextRequest) {
  try {
    // First, verify the user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, reason: 'Unauthorized. Please sign in.' },
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
        { success: false, reason: 'Invalid request body.' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { success: false, reason: 'No invite code provided.' },
        { status: 400 }
      )
    }

    // Use admin client to consume the invite (bypasses RLS)
    const adminClient = createAdminClient()

    // Call the consume_invite function
    const { data, error } = await adminClient
      .rpc('consume_invite', { 
        p_code: code.trim(), 
        p_user_id: user.id 
      })

    if (error) {
      console.error('Error consuming invite:', error)
      return NextResponse.json(
        { success: false, reason: 'Failed to consume invite.' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        reason: 'Invite code is invalid, expired, or has reached its maximum uses.',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error consuming invite:', error)
    return NextResponse.json(
      { success: false, reason: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
