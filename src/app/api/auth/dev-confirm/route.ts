import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Development-only endpoint to auto-confirm a user's email.
 * 
 * This bypasses email verification for testing purposes.
 * Only available when NEXT_PUBLIC_DEV_AUTO_CONFIRM=true
 * 
 * POST /api/auth/dev-confirm
 * Body: { userId: string }
 */
export async function POST(request: Request) {
  // Only allow in development mode with explicit flag
  const isDev = process.env.NODE_ENV === 'development'
  const devAutoConfirm = process.env.NEXT_PUBLIC_DEV_AUTO_CONFIRM === 'true'
  
  if (!isDev || !devAutoConfirm) {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode with DEV_AUTO_CONFIRM enabled' },
      { status: 403 }
    )
  }

  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    
    // Use admin API to update user's email_confirmed_at
    const { data, error } = await adminClient.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    )

    if (error) {
      console.error('Failed to auto-confirm user:', error)
      return NextResponse.json(
        { error: 'Failed to confirm user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: 'User email confirmed (dev mode)'
    })
  } catch (err) {
    console.error('Dev confirm error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
