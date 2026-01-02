import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Primary domain for canonical redirects
const PRIMARY_DOMAIN = 'sitesistersconstruction.com'

// Routes that require authentication
// Note: /design is intentionally NOT protected - it's the public landing page
// that uses useGatedAction() for protected actions like posting
const PROTECTED_ROUTES = ['/app', '/account', '/inbox', '/browse']

// Routes that should redirect to /design if already authenticated
const AUTH_ROUTES = ['/sign-in', '/sign-up', '/signup']

// Auth callback route - should never be redirected
const AUTH_CALLBACK_ROUTE = '/auth/callback'

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * Detect if a request is a Next.js prefetch or RSC request.
 * These should NOT trigger auth redirects to avoid log spam and unnecessary 307s.
 */
function isPrefetchOrRSCRequest(request: NextRequest): boolean {
  const headers = request.headers
  
  // Next.js Link prefetch header
  if (headers.get('next-router-prefetch') === '1') return true
  
  // Generic prefetch purpose header
  if (headers.get('purpose') === 'prefetch') return true
  
  // Middleware prefetch header
  if (headers.get('x-middleware-prefetch') === '1') return true
  
  // RSC (React Server Components) requests - these have special headers
  // but should still be allowed through for session refresh
  // We only skip redirects for prefetch, not all RSC requests
  
  return false
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl
  
  // Redirect non-primary domains to the primary domain (except localhost/preview deployments)
  if (
    hostname &&
    !hostname.includes('localhost') &&
    !hostname.includes('vercel.app') &&
    !hostname.includes(PRIMARY_DOMAIN)
  ) {
    const url = new URL(request.url)
    url.hostname = PRIMARY_DOMAIN
    url.port = ''
    return NextResponse.redirect(url, { status: 301 })
  }

  // Skip auth logic entirely for prefetch requests to avoid redirect noise
  // Prefetch requests should pass through without triggering auth redirects
  const isPrefetch = isPrefetchOrRSCRequest(request)
  if (isPrefetch) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  // Auth callback route handles its own logic - don't interfere
  if (pathname.startsWith(AUTH_CALLBACK_ROUTE)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip auth refresh if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Handle protected routes - redirect to sign-in if not authenticated
  if (isProtectedRoute(pathname) && !user) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Legacy signup redirect to new sign-up (preserve query params)
  if (pathname === '/signup') {
    const signUpUrl = new URL('/sign-up', request.url)
    request.nextUrl.searchParams.forEach((value, key) => {
      signUpUrl.searchParams.set(key, value)
    })
    return NextResponse.redirect(signUpUrl)
  }

  // Handle auth routes - redirect to /design if already authenticated
  if (isAuthRoute(pathname) && user) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = next && next.startsWith('/') ? next : '/design'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (common static files)
     * - Static asset file extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
}
