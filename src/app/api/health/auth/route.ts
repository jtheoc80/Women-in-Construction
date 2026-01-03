import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * Health Check: Auth endpoint
 * 
 * GET /api/health/auth
 * 
 * Returns:
 * - ok: Whether Supabase is reachable
 * - hasSession: Whether the current request has an authenticated session
 * - timestamp: Server timestamp
 * - supabase: Connection status and version info
 * 
 * This endpoint is useful for:
 * 1. Verifying Supabase configuration is correct
 * 2. Checking if auth cookies are being sent correctly
 * 3. Debugging session issues
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Check if Supabase client is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasCredentials = Boolean(supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    if (!hasCredentials) {
      return NextResponse.json({
        ok: false,
        hasSession: false,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        error: 'Supabase credentials not configured',
        supabase: {
          configured: false,
          url: null,
        },
      }, { status: 503 })
    }

    // Try to get the current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Try a simple health check query to verify database connectivity
    let dbHealthy = false
    let dbError: string | null = null
    
    try {
      // Simple query to check database is reachable
      const { error: queryError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      dbHealthy = !queryError
      dbError = queryError?.message || null
    } catch (err) {
      dbError = err instanceof Error ? err.message : 'Unknown database error'
    }

    const response = {
      ok: !userError && dbHealthy,
      hasSession: Boolean(user),
      user: user ? {
        id: user.id,
        email: user.email || null,
        phone: user.phone || null,
        emailConfirmed: Boolean(user.email_confirmed_at),
        phoneConfirmed: Boolean(user.phone_confirmed_at),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
      } : null,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      supabase: {
        configured: true,
        url: supabaseUrl?.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co',
        authHealthy: !userError,
        authError: userError?.message || null,
        dbHealthy,
        dbError,
      },
    }

    return NextResponse.json(response, {
      status: response.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('[Health/Auth] Unexpected error:', err)
    
    return NextResponse.json({
      ok: false,
      hasSession: false,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error',
      supabase: {
        configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        url: null,
      },
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  }
}
