import { NextRequest, NextResponse } from 'next/server'
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

/**
 * GET /api/invites/resolve?code=XXXXX
 * Server-only: Validates an invite code without requiring authentication.
 * Uses service role to bypass RLS since invites are private.
 * 
 * Response:
 * - { valid: true, inviter_display_name?: string } if code is valid
 * - { valid: false, reason: string } if code is invalid/expired/maxed
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { valid: false, reason: 'No invite code provided.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Use the validate_invite_code function
    const { data, error } = await adminClient
      .rpc('validate_invite_code', { p_code: code.trim() })
      .single<ValidateInviteResult>()

    if (error) {
      console.error('Error validating invite code:', error)
      return NextResponse.json(
        { valid: false, reason: 'Failed to validate invite code.' },
        { status: 500 }
      )
    }

    if (!data || !data.is_valid) {
      // Determine the specific reason
      let reason = 'Invalid invite code.'
      
      if (data && data.id) {
        // Invite exists but is not valid
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          reason = 'This invite has expired.'
        } else if (data.max_uses !== null && data.uses !== null && data.uses >= data.max_uses) {
          reason = 'This invite has reached its maximum uses.'
        }
      }

      return NextResponse.json({ valid: false, reason })
    }

    // Optionally fetch the inviter's display name for a friendlier UX
    let inviterDisplayName: string | null = null
    if (data.inviter_user_id) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('display_name, first_name')
        .eq('id', data.inviter_user_id)
        .single()

      if (profile) {
        inviterDisplayName = profile.display_name || profile.first_name || null
      }
    }

    return NextResponse.json({
      valid: true,
      inviter_display_name: inviterDisplayName,
    })
  } catch (error) {
    console.error('Unexpected error resolving invite:', error)
    return NextResponse.json(
      { valid: false, reason: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
