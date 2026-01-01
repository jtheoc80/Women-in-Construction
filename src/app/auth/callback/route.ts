import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/design'

  // If Supabase isn't configured, just continue.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL(next, requestUrl))
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore
          }
        },
      },
    })

    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, requestUrl))
}

