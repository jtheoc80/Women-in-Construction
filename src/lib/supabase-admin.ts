import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Creates a Supabase client with service role key.
 * This client bypasses RLS and should ONLY be used in server-side code.
 * 
 * Use cases:
 * - Validating invite codes (invites table has restrictive RLS)
 * - Consuming invites after signup
 * - Any admin operations that need to bypass RLS
 */
export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'The service role key is required for admin operations.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
