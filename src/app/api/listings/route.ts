import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Configuration
const RATE_LIMIT_BUCKET = 'post_listing'
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const RATE_LIMIT_MAX = 5 // max 5 listings per hour per IP

// Get client IP from request
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

// Check and update rate limit
async function checkRateLimit(
  adminClient: ReturnType<typeof createAdminClient>,
  identifier: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date()
  windowStart.setMinutes(0, 0, 0) // Round to hour start

  // Try to get existing rate limit record
  const { data: existing } = await adminClient
    .from('rate_limits')
    .select('request_count')
    .eq('bucket', RATE_LIMIT_BUCKET)
    .eq('identifier', identifier)
    .eq('window_start', windowStart.toISOString())
    .single()

  if (existing) {
    if (existing.request_count >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 }
    }

    // Increment counter
    await adminClient
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('bucket', RATE_LIMIT_BUCKET)
      .eq('identifier', identifier)
      .eq('window_start', windowStart.toISOString())

    return { allowed: true, remaining: RATE_LIMIT_MAX - existing.request_count - 1 }
  }

  // Create new rate limit record
  await adminClient.from('rate_limits').insert({
    bucket: RATE_LIMIT_BUCKET,
    identifier,
    window_start: windowStart.toISOString(),
    request_count: 1,
  })

  return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
}

// Input validation types
interface ProfileInput {
  displayName: string
  company: string
  role?: string
  contactPreference: string
  contactValue: string
}

interface ListingInput {
  title?: string
  city: string
  area?: string
  rentMin?: number
  rentMax?: number
  moveInISO?: string
  roomType: string
  commuteArea?: string
  tags?: string[]
  bio?: string
  placeId?: string
  lat?: number
  lng?: number
}

interface CreateListingRequest {
  profile: ProfileInput
  listing: ListingInput
  photoPaths?: string[]
  website?: string // honeypot
}

// Validate the request body
function validateRequest(body: unknown): { valid: true; data: CreateListingRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const req = body as CreateListingRequest

  // Check honeypot - if filled, it's likely a bot
  if (req.website && req.website.trim() !== '') {
    return { valid: false, error: 'Invalid request' }
  }

  // Validate profile
  if (!req.profile || typeof req.profile !== 'object') {
    return { valid: false, error: 'Profile information is required' }
  }
  if (!req.profile.displayName || req.profile.displayName.trim() === '') {
    return { valid: false, error: 'Display name is required' }
  }
  if (!req.profile.company || req.profile.company.trim() === '') {
    return { valid: false, error: 'Company is required' }
  }
  if (!req.profile.contactPreference || !['email', 'phone', 'instagram', 'other'].includes(req.profile.contactPreference)) {
    return { valid: false, error: 'Valid contact preference is required (email, phone, instagram, other)' }
  }
  if (!req.profile.contactValue || req.profile.contactValue.trim() === '') {
    return { valid: false, error: 'Contact value is required' }
  }

  // Validate listing
  if (!req.listing || typeof req.listing !== 'object') {
    return { valid: false, error: 'Listing information is required' }
  }
  if (!req.listing.city || req.listing.city.trim() === '') {
    return { valid: false, error: 'City is required' }
  }
  if (!req.listing.roomType || !['private_room', 'shared_room', 'entire_place'].includes(req.listing.roomType)) {
    return { valid: false, error: 'Valid room type is required (private_room, shared_room, entire_place)' }
  }

  // Validate coordinates if provided
  if (req.listing.lat !== undefined && req.listing.lat !== null) {
    if (typeof req.listing.lat !== 'number' || isNaN(req.listing.lat) || req.listing.lat < -90 || req.listing.lat > 90) {
      return { valid: false, error: 'Latitude must be a number between -90 and 90' }
    }
  }
  if (req.listing.lng !== undefined && req.listing.lng !== null) {
    if (typeof req.listing.lng !== 'number' || isNaN(req.listing.lng) || req.listing.lng < -180 || req.listing.lng > 180) {
      return { valid: false, error: 'Longitude must be a number between -180 and 180' }
    }
  }

  // Validate photo paths if provided
  if (req.photoPaths && !Array.isArray(req.photoPaths)) {
    return { valid: false, error: 'Photo paths must be an array' }
  }

  return { valid: true, data: req }
}

/**
 * POST /api/listings
 * Create a new listing with profile, contact info, and photos
 * 
 * Request body:
 * - profile: { displayName, company, role?, contactPreference, contactValue }
 * - listing: { title?, city, area?, rentMin?, rentMax?, moveInISO?, roomType, commuteArea?, tags?, bio?, placeId?, lat?, lng? }
 * - photoPaths?: string[] (storage paths returned from /api/upload)
 * - website: honeypot field (should be empty)
 * 
 * Note: Photo paths from /api/upload should be used as-is. They contain the upload batch ID
 * as the folder name, which tracks the photos for this listing in storage.
 * 
 * Response: { ok: true, id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Rate limiting
    const clientIP = getClientIP(req)
    const { allowed, remaining } = await checkRateLimit(adminClient, clientIP)

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. You can post up to 5 listings per hour.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.ceil(Date.now() / 1000 / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW).toString(),
          },
        }
      )
    }

    // Parse and validate request body
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

    const { profile, listing, photoPaths } = validation.data

    // 1. Create poster profile
    const { data: profileData, error: profileError } = await adminClient
      .from('poster_profiles')
      .insert({
        display_name: profile.displayName.trim(),
        company: profile.company.trim(),
        role: profile.role?.trim() || null,
      })
      .select('id')
      .single()

    if (profileError || !profileData) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ ok: false, error: 'Failed to create profile' }, { status: 500 })
    }

    const profileId = profileData.id

    // 2. Create profile contact (private)
    const { error: contactError } = await adminClient.from('profile_contacts').insert({
      profile_id: profileId,
      contact_preference: profile.contactPreference,
      contact_value: profile.contactValue.trim(),
    })

    if (contactError) {
      console.error('Error creating contact:', contactError)
      // Clean up profile
      await adminClient.from('poster_profiles').delete().eq('id', profileId)
      return NextResponse.json({ ok: false, error: 'Failed to save contact information' }, { status: 500 })
    }

    // 3. Create listing
    const { data: listingData, error: listingError } = await adminClient
      .from('listings')
      .insert({
        poster_profile_id: profileId,
        title: listing.title?.trim() || null,
        city: listing.city.trim(),
        area: listing.area?.trim() || null,
        rent_min: listing.rentMin || null,
        rent_max: listing.rentMax || null,
        move_in: listing.moveInISO || null,
        room_type: listing.roomType,
        commute_area: listing.commuteArea?.trim() || null,
        tags: listing.tags || null,
        details: listing.bio?.trim() || null,
        place_id: listing.placeId || null,
        lat: listing.lat || null,
        lng: listing.lng || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (listingError || !listingData) {
      console.error('Error creating listing:', listingError)
      // Clean up profile and contact
      await adminClient.from('profile_contacts').delete().eq('profile_id', profileId)
      await adminClient.from('poster_profiles').delete().eq('id', profileId)
      return NextResponse.json({ ok: false, error: 'Failed to create listing' }, { status: 500 })
    }

    const listingId = listingData.id

    // 4. Insert listing photos if provided
    if (photoPaths && photoPaths.length > 0) {
      const photoRecords = photoPaths.map((path, index) => ({
        listing_id: listingId,
        storage_path: path,
        sort_order: index,
      }))

      const { error: photosError } = await adminClient.from('listing_photos').insert(photoRecords)

      if (photosError) {
        console.error('Error creating photo records:', photosError)
        // Don't fail the whole request, just log the error
        // Photos can be added later if needed
      }
    }

    return NextResponse.json(
      { ok: true, id: listingId },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Unexpected error creating listing:', error)
    return NextResponse.json({ ok: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
