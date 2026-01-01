import { createClient } from '@supabase/supabase-js'

// Server-only env vars - prefer SUPABASE_URL over NEXT_PUBLIC_SUPABASE_URL for server code
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Creates a Supabase client with service role key.
 * This client bypasses RLS and should ONLY be used in server-side code.
 * 
 * Use cases:
 * - Validating invite codes (invites table has restrictive RLS)
 * - Consuming invites after signup
 * - Any admin operations that need to bypass RLS
 * 
 * Environment variables (server-only):
 * - SUPABASE_URL: The Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: The service role key (never expose to client)
 */
export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'These are required for admin operations and should only be set server-side.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
