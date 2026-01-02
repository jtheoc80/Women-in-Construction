import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function requireEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: string | undefined) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function createRouteClient(req: NextRequest) {
  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {
          // Route handlers don't need to set auth cookies for this endpoint.
        },
      },
    }
  )
}

interface CreateListingRequest {
  listing: {
    title?: string
    city: string
    area?: string
    rentMin?: number
    rentMax?: number
    moveInISO?: string
    roomType: 'private_room' | 'shared_room' | 'entire_place'
    commuteArea?: string
    tags?: string[]
    details?: string
    placeId?: string
    lat?: number
    lng?: number
    fullAddress?: string
  }
  photoPaths?: string[]
  website?: string // honeypot
}

function validateRequest(body: unknown): { valid: true; data: CreateListingRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Invalid request body' }
  const req = body as CreateListingRequest

  if (req.website && req.website.trim() !== '') return { valid: false, error: 'Invalid request' }
  if (!req.listing || typeof req.listing !== 'object') return { valid: false, error: 'Listing is required' }
  if (!req.listing.city || req.listing.city.trim() === '') return { valid: false, error: 'City is required' }
  if (!req.listing.roomType || !['private_room', 'shared_room', 'entire_place'].includes(req.listing.roomType)) {
    return { valid: false, error: 'Valid room type is required' }
  }
  if (req.photoPaths && !Array.isArray(req.photoPaths)) return { valid: false, error: 'photoPaths must be an array' }

  return { valid: true, data: req }
}

/**
 * POST /api/listings
 * Creates a listing owned by the authenticated user (RLS enforced).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient(req)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure profile row exists, then enforce required profile fields for posting.
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name,company')
      .eq('id', user.id)
      .single()

    const isProfileComplete = Boolean(profile?.display_name?.trim() && profile?.company?.trim())
    if (!isProfileComplete) {
      return NextResponse.json(
        { ok: false, error: 'Please complete your profile before posting a listing.' },
        { status: 403 }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 })
    }

    const { listing, photoPaths } = validation.data

    const { data: inserted, error: insertError } = await supabase
      .from('listings')
      .insert({
        owner_id: user.id,
        title: listing.title?.trim() || null,
        city: listing.city.trim(),
        area: listing.area?.trim() || null,
        rent_min: listing.rentMin ?? null,
        rent_max: listing.rentMax ?? null,
        move_in: listing.moveInISO || null,
        room_type: listing.roomType,
        commute_area: listing.commuteArea?.trim() || null,
        tags: listing.tags || null,
        details: listing.details?.trim() || null,
        place_id: listing.placeId || null,
        lat: listing.lat ?? null,
        lng: listing.lng ?? null,
        full_address: listing.fullAddress?.trim() || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('Error creating listing:', insertError)
      return NextResponse.json({ ok: false, error: 'Failed to create listing' }, { status: 500 })
    }

    if (photoPaths && photoPaths.length > 0) {
      const photoRecords = photoPaths.map((path, index) => ({
        listing_id: inserted.id,
        storage_path: path,
        sort_order: index,
      }))
      const { error: photoError } = await supabase.from('listing_photos').insert(photoRecords)
      if (photoError) {
        // Photo record errors shouldn't fail the listing creation.
        console.error('Error creating photo records:', photoError)
      }
    }

    return NextResponse.json({ ok: true, id: inserted.id })
  } catch (error) {
    console.error('Unexpected error creating listing:', error)
    return NextResponse.json({ ok: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
