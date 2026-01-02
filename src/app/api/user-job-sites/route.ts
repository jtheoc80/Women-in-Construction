import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import type { CreateUserJobSiteInput } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a server client for auth verification
async function createAuthClient(req: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll() {
        // Not setting cookies in API routes
      },
    },
  })
}

// Input validation
function validateCreateInput(body: unknown): { valid: true; data: CreateUserJobSiteInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as CreateUserJobSiteInput

  // Required fields
  if (!input.name || typeof input.name !== 'string' || input.name.trim() === '') {
    return { valid: false, error: 'Job site name is required' }
  }

  if (!input.address_line1 || typeof input.address_line1 !== 'string' || input.address_line1.trim() === '') {
    return { valid: false, error: 'Address line 1 is required' }
  }

  if (!input.city || typeof input.city !== 'string' || input.city.trim() === '') {
    return { valid: false, error: 'City is required' }
  }

  if (!input.state || typeof input.state !== 'string' || input.state.trim() === '') {
    return { valid: false, error: 'State is required' }
  }

  if (!input.zip || typeof input.zip !== 'string' || input.zip.trim() === '') {
    return { valid: false, error: 'ZIP code is required' }
  }

  // Basic ZIP validation (5 digits)
  const zipRegex = /^\d{5}(-\d{4})?$/
  if (!zipRegex.test(input.zip.trim())) {
    return { valid: false, error: 'ZIP code must be 5 digits (or 5+4 format)' }
  }

  return {
    valid: true,
    data: {
      name: input.name.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      city: input.city.trim(),
      state: input.state.trim().toUpperCase(),
      zip: input.zip.trim(),
      notes: input.notes?.trim() || null,
    },
  }
}

/**
 * GET /api/user-job-sites
 * Fetch all job sites for the authenticated user
 * 
 * Query params:
 * - status: 'active' | 'archived' | 'all' (default: 'active')
 */
export async function GET(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json([])
    }

    // Verify authentication
    const authClient = await createAuthClient(req)
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'

    // Build query
    let query = adminClient
      .from('user_job_sites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by status unless 'all'
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: jobSites, error } = await query

    if (error) {
      console.error('[User Job Sites GET] Error:', error.message)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch job sites' },
        { status: 500 }
      )
    }

    return NextResponse.json(jobSites || [])
  } catch (error) {
    console.error('[User Job Sites GET] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch job sites' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user-job-sites
 * Create a new job site for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: 'Service not configured' },
        { status: 503 }
      )
    }

    // Verify authentication
    const authClient = await createAuthClient(req)
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = validateCreateInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check for potential duplicate (same name + zip for this user)
    const { data: existing } = await adminClient
      .from('user_job_sites')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('name', validation.data.name)
      .eq('zip', validation.data.zip)
      .eq('status', 'active')
      .single()

    // Create the job site
    const { data: jobSite, error: createError } = await adminClient
      .from('user_job_sites')
      .insert({
        user_id: user.id,
        ...validation.data,
      })
      .select()
      .single()

    if (createError) {
      console.error('[User Job Sites POST] Error creating job site:', createError.message)
      return NextResponse.json(
        { ok: false, error: 'Failed to create job site' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      jobSite,
      warning: existing ? `A job site with the same name and ZIP code already exists` : undefined,
    })
  } catch (error) {
    console.error('[User Job Sites POST] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
