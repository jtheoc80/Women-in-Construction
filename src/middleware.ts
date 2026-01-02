import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Primary domain for canonical redirects
const PRIMARY_DOMAIN = 'sitesistersconstruction.com'

function isPublicPath(pathname: string) {
  // Public/auth pages
  if (pathname === '/sign-in' || pathname === '/sign-up') return true
  if (pathname.startsWith('/invite')) return true

  // Route handlers should not be redirected by auth gating
  if (pathname.startsWith('/api')) return true

  // Static-ish common files (also covered by matcher, but keep safe)
  if (pathname === '/favicon.ico') return true
  return false
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
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
