import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

function requireEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/**
 * Browser/client-component Supabase client.
 *
 * Uses:
 * - Client Components
 * - Hooks (AuthContext)
 */
export function createBrowserClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

let singleton: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function getBrowserClient() {
  if (!singleton) {
    singleton = createBrowserClient()
  }
  return singleton
}

