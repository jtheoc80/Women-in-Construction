import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Primary domain for canonical redirects - configurable via env var
// Set NEXT_PUBLIC_PRIMARY_DOMAIN to your custom domain to enable canonical redirects
const PRIMARY_DOMAIN = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'sitesistersconstruction.com'

// Routes that require authentication
// Protected routes redirect to /signup if not authenticated
const PROTECTED_ROUTES = ['/account', '/inbox', '/design']

// Routes that should redirect to /browse if already authenticated
// Note: /sign-up is handled by next.config.js redirect to /signup
const AUTH_ROUTES = ['/sign-in', '/signup']

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

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * Detect if a request is a Next.js prefetch request.
 * These should NOT trigger auth redirects to avoid log spam and unnecessary 307s.
 */
function isPrefetchRequest(request: NextRequest): boolean {
  const headers = request.headers
  
  // Next.js Link prefetch header
  if (headers.get('next-router-prefetch') === '1') return true
  
  // Generic prefetch purpose header
  if (headers.get('purpose') === 'prefetch') return true
  
  // Middleware prefetch header
  if (headers.get('x-middleware-prefetch') === '1') return true
  
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

  // Skip auth logic for API routes - they handle their own auth
  if (isApiRoute(pathname)) {
    return NextResponse.next()
  }

  // Auth callback route handles its own logic - don't interfere
  if (pathname.startsWith(AUTH_CALLBACK_ROUTE)) {
    return NextResponse.next()
  }

  // Skip auth redirects for prefetch requests to avoid log spam
  // But still allow session refresh to happen
  const isPrefetch = isPrefetchRequest(request)

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

  // IMPORTANT: Refresh session if expired - required for Server Components
  // This must be called to refresh the session cookie
  const { data: { user } } = await supabase.auth.getUser()

  // Skip redirects for prefetch requests (but session refresh above still runs)
  if (isPrefetch) {
    return response
  }

  // Handle protected routes - redirect to signup if not authenticated
  if (isProtectedRoute(pathname) && !user) {
    const signupUrl = new URL('/signup', request.url)
    signupUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(signupUrl)
  }

  // Handle auth routes - redirect to /browse if already authenticated
  if (isAuthRoute(pathname) && user) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = next && next.startsWith('/') ? next : '/browse'
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
