import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Auth Callback Route Handler
 * 
 * This route handles the OAuth/email confirmation callback from Supabase.
 * It exchanges the code for a session and redirects the user to the appropriate page.
 * 
 * Expected URL params:
 * - code: The authorization code from Supabase (for PKCE flow)
 * - next: Optional redirect path after successful auth
 * - error: Error code if auth failed
 * - error_description: Human-readable error message
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/browse'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth Callback] Received request:', {
      hasCode: !!code,
      next,
      error,
      errorDescription,
    })
  }

  // Handle error from Supabase (e.g., invalid redirect URL)
  if (error) {
    const errorMessage = errorDescription || error
    console.error('[Auth Callback] Error from Supabase:', errorMessage)
    
    // Redirect to sign-in with error message
    const signInUrl = new URL('/sign-in', origin)
    signInUrl.searchParams.set('error', errorMessage)
    if (next && next !== '/browse') {
      signInUrl.searchParams.set('next', next)
    }
    return NextResponse.redirect(signInUrl)
  }

  // If no code, redirect to sign-in
  if (!code) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth Callback] No code provided, redirecting to sign-in')
    }
    return NextResponse.redirect(new URL('/sign-in', origin))
  }

  // Exchange the code for a session
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Auth Callback] Supabase credentials not configured')
    return NextResponse.redirect(new URL('/sign-in?error=Configuration+error', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth Callback] Exchange result:', {
      success: !!data?.session,
      error: exchangeError?.message,
      userId: data?.user?.id,
    })
  }

  if (exchangeError) {
    console.error('[Auth Callback] Failed to exchange code:', exchangeError.message)
    
    const signInUrl = new URL('/sign-in', origin)
    signInUrl.searchParams.set('error', exchangeError.message)
    if (next && next !== '/browse') {
      signInUrl.searchParams.set('next', next)
    }
    return NextResponse.redirect(signInUrl)
  }

  // Success! Redirect to the intended destination
  // Ensure next is a safe internal path
  const safeNext = next.startsWith('/') ? next : '/browse'
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth Callback] Success! Redirecting to:', safeNext)
  }

  // Use the site URL for production redirects, origin for local dev
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  return NextResponse.redirect(new URL(safeNext, baseUrl))
}
