import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import type { UpdateUserJobSiteInput } from '@/lib/supabase'

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

// Input validation for updates
function validateUpdateInput(body: unknown): { valid: true; data: UpdateUserJobSiteInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const input = body as UpdateUserJobSiteInput
  const data: UpdateUserJobSiteInput = {}

  // Validate optional fields if provided
  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      return { valid: false, error: 'Job site name cannot be empty' }
    }
    data.name = input.name.trim()
  }

  if (input.address_line1 !== undefined) {
    if (typeof input.address_line1 !== 'string' || input.address_line1.trim() === '') {
      return { valid: false, error: 'Address line 1 cannot be empty' }
    }
    data.address_line1 = input.address_line1.trim()
  }

  if (input.address_line2 !== undefined) {
    data.address_line2 = input.address_line2?.trim() || null
  }

  if (input.city !== undefined) {
    if (typeof input.city !== 'string' || input.city.trim() === '') {
      return { valid: false, error: 'City cannot be empty' }
    }
    data.city = input.city.trim()
  }

  if (input.state !== undefined) {
    if (typeof input.state !== 'string' || input.state.trim() === '') {
      return { valid: false, error: 'State cannot be empty' }
    }
    data.state = input.state.trim().toUpperCase()
  }

  if (input.zip !== undefined) {
    if (typeof input.zip !== 'string' || input.zip.trim() === '') {
      return { valid: false, error: 'ZIP code cannot be empty' }
    }
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(input.zip.trim())) {
      return { valid: false, error: 'ZIP code must be 5 digits (or 5+4 format)' }
    }
    data.zip = input.zip.trim()
  }

  if (input.notes !== undefined) {
    data.notes = input.notes?.trim() || null
  }

  if (input.status !== undefined) {
    if (!['active', 'archived'].includes(input.status)) {
      return { valid: false, error: 'Status must be "active" or "archived"' }
    }
    data.status = input.status
  }

  if (Object.keys(data).length === 0) {
    return { valid: false, error: 'No valid fields to update' }
  }

  return { valid: true, data }
}

/**
 * GET /api/user-job-sites/[id]
 * Fetch a single job site by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const adminClient = createAdminClient()

    const { data: jobSite, error } = await adminClient
      .from('user_job_sites')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !jobSite) {
      return NextResponse.json(
        { ok: false, error: 'Job site not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(jobSite)
  } catch (error) {
    console.error('[User Job Sites GET by ID] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch job site' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user-job-sites/[id]
 * Update a job site
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    const validation = validateUpdateInput(body)
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Verify ownership before update
    const { data: existing } = await adminClient
      .from('user_job_sites')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Job site not found' },
        { status: 404 }
      )
    }

    // Update the job site
    const { data: jobSite, error: updateError } = await adminClient
      .from('user_job_sites')
      .update(validation.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[User Job Sites PATCH] Error:', updateError.message)
      return NextResponse.json(
        { ok: false, error: 'Failed to update job site' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, jobSite })
  } catch (error) {
    console.error('[User Job Sites PATCH] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user-job-sites/[id]
 * Delete a job site (or archive it)
 * 
 * Query params:
 * - hard: if 'true', permanently delete. Otherwise, archive.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    const adminClient = createAdminClient()
    const { searchParams } = new URL(req.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Verify ownership
    const { data: existing } = await adminClient
      .from('user_job_sites')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Job site not found' },
        { status: 404 }
      )
    }

    if (hardDelete) {
      // Permanently delete
      const { error: deleteError } = await adminClient
        .from('user_job_sites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('[User Job Sites DELETE] Error:', deleteError.message)
        return NextResponse.json(
          { ok: false, error: 'Failed to delete job site' },
          { status: 500 }
        )
      }
    } else {
      // Soft delete (archive)
      const { error: archiveError } = await adminClient
        .from('user_job_sites')
        .update({ status: 'archived' })
        .eq('id', id)
        .eq('user_id', user.id)

      if (archiveError) {
        console.error('[User Job Sites DELETE] Error archiving:', archiveError.message)
        return NextResponse.json(
          { ok: false, error: 'Failed to archive job site' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[User Job Sites DELETE] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
