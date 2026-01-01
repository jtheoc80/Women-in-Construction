import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { nanoid } from 'nanoid'

/**
 * POST /api/invites/create
 * Creates a new invite code for the authenticated user.
 * If the user already has an active invite, returns the existing one.
 * 
 * Request body (optional):
 * - max_uses?: number - Maximum number of times this invite can be used
 * - expires_in_days?: number - Number of days until expiration
 * 
 * Response:
 * - { code, url, uses, max_uses, expires_at }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create an invite.' },
        { status: 401 }
      )
    }

    // Use admin client for all invite operations (bypasses RLS)
    const adminClient = createAdminClient()

    // Parse optional body parameters
    let maxUses: number | null = null
    let expiresAt: string | null = null

    try {
      const body = await req.json()
      if (body.max_uses && typeof body.max_uses === 'number' && body.max_uses > 0) {
        maxUses = body.max_uses
      }
      if (body.expires_in_days && typeof body.expires_in_days === 'number' && body.expires_in_days > 0) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + body.expires_in_days)
        expiresAt = expDate.toISOString()
      }
    } catch {
      // Body is optional, ignore parsing errors
    }

    // Check if user already has an active invite (unlimited or not maxed out)
    const { data: existingInvite } = await adminClient
      .from('invites')
      .select('*')
      .eq('inviter_user_id', user.id)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingInvite) {
      // Check if it's still usable (not maxed out)
      const isUsable = existingInvite.max_uses === null || 
        existingInvite.uses < existingInvite.max_uses

      if (isUsable) {
        // Get origin from request headers or fall back to env
        const origin = req.headers.get('origin') || 
          process.env.NEXT_PUBLIC_APP_URL || 
          'http://localhost:3000'
        
        return NextResponse.json({
          code: existingInvite.code,
          url: `${origin}/invite/${existingInvite.code}`,
          uses: existingInvite.uses,
          max_uses: existingInvite.max_uses,
          expires_at: existingInvite.expires_at,
        })
      }
    }

    // Generate a new invite code (10-12 chars, URL-safe)
    const code = nanoid(12)

    const { data: newInvite, error: insertError } = await adminClient
      .from('invites')
      .insert({
        code,
        inviter_user_id: user.id,
        max_uses: maxUses,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating invite:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invite. Please try again.' },
        { status: 500 }
      )
    }

    // Get origin from request headers or fall back to env
    const origin = req.headers.get('origin') || 
      process.env.NEXT_PUBLIC_APP_URL || 
      'http://localhost:3000'

    return NextResponse.json({
      code: newInvite.code,
      url: `${origin}/invite/${newInvite.code}`,
      uses: newInvite.uses,
      max_uses: newInvite.max_uses,
      expires_at: newInvite.expires_at,
    })
  } catch (error) {
    console.error('Unexpected error in invite creation:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/invites/create
 * Returns the user's current active invite if one exists.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Use admin client for all invite operations (bypasses RLS)
    const adminClient = createAdminClient()

    // Get user's active invite
    const { data: existingInvite } = await adminClient
      .from('invites')
      .select('*')
      .eq('inviter_user_id', user.id)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!existingInvite) {
      return NextResponse.json({ invite: null })
    }

    const isUsable = existingInvite.max_uses === null || 
      existingInvite.uses < existingInvite.max_uses

    // Get origin from request headers or fall back to env
    const origin = req.headers.get('origin') || 
      process.env.NEXT_PUBLIC_APP_URL || 
      'http://localhost:3000'

    return NextResponse.json({
      invite: {
        code: existingInvite.code,
        url: `${origin}/invite/${existingInvite.code}`,
        uses: existingInvite.uses,
        max_uses: existingInvite.max_uses,
        expires_at: existingInvite.expires_at,
        is_usable: isUsable,
      },
    })
  } catch (error) {
    console.error('Unexpected error fetching invite:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
