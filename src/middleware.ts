import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Primary domain for canonical redirects
const PRIMARY_DOMAIN = 'sitesistersconstruction.com'

// Routes that require authentication
const PROTECTED_ROUTES = ['/design', '/app', '/account', '/inbox', '/browse']

// Routes that should redirect to /design if already authenticated
const AUTH_ROUTES = ['/sign-in', '/sign-up', '/signup']

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

  // Handle auth routes - redirect to /design if already authenticated
  if (isAuthRoute(pathname) && user) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = next && next.startsWith('/') ? next : '/design'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Legacy signup redirect to new sign-up
  if (pathname === '/signup') {
    const signUpUrl = new URL('/sign-up', request.url)
    // Preserve query params
    request.nextUrl.searchParams.forEach((value, key) => {
      signUpUrl.searchParams.set(key, value)
    })
    return NextResponse.redirect(signUpUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
