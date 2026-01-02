import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'

// Configuration
const RATE_LIMIT_BUCKET = 'post_listing'
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const RATE_LIMIT_MAX = 5 // max 5 listings per hour per IP

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
  fullAddress?: string
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

  // Validate photo paths if provided
  if (req.photoPaths && !Array.isArray(req.photoPaths)) {
    return { valid: false, error: 'Photo paths must be an array' }
  }

  return { valid: true, data: req }
}

/**
 * GET /api/listings
 * Fetch all active listings with related profile and photo data
 * 
 * Response: Array of listings with poster_profiles and listing_photos
 */
export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Fetch all active listings with related data
    // Use explicit foreign key hint (poster_profile_id) for PostgREST to find the relationship
    const { data: listings, error } = await adminClient
      .from('listings')
      .select(`
        *,
        poster_profiles!poster_profile_id (
          id,
          display_name,
          company,
          role
        ),
        listing_photos (
          id,
          listing_id,
          storage_path,
          sort_order
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
      // Return empty array on error to prevent frontend from breaking
      return NextResponse.json([])
    }

    // Return empty array if no listings found
    return NextResponse.json(listings || [])
  } catch (error) {
    console.error('Unexpected error fetching listings:', error)
    // Return empty array on error to prevent frontend from breaking
    return NextResponse.json([])
  }
}

/**
 * POST /api/listings
 * Create a new listing with profile, contact info, and photos
 * 
 * REQUIRES: Authenticated user with a complete profile (first_name and home_city)
 * 
 * Request body:
 * - profile: { displayName, company, role?, contactPreference, contactValue }
 * - listing: { title?, city, area?, rentMin?, rentMax?, moveInISO?, roomType, commuteArea?, tags?, bio?, placeId?, lat?, lng?, fullAddress? }
 * - photoPaths?: string[] (returned from /api/upload)
 * - website: honeypot field (should be empty)
 * 
 * Response: { ok: true, id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const authClient = await createAuthClient(req)
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'You must be logged in to post a listing' },
        { status: 401 }
      )
    }

    // ========================================
    // 2. PROFILE COMPLETION CHECK
    // ========================================
    const { data: userProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('id, first_name, home_city')
      .eq('id', user.id)
      .single()

    if (profileCheckError || !userProfile) {
      return NextResponse.json(
        { ok: false, error: 'Profile not found. Please complete your profile first.' },
        { status: 403 }
      )
    }

    const isProfileComplete = Boolean(
      userProfile.first_name && 
      userProfile.first_name.trim() !== '' && 
      userProfile.home_city && 
      userProfile.home_city.trim() !== ''
    )

    if (!isProfileComplete) {
      return NextResponse.json(
        { ok: false, error: 'Please complete your profile before posting a listing. You need to set your first name and home city.' },
        { status: 403 }
      )
    }

    // ========================================
    // 3. RATE LIMITING
    // ========================================
    // Use user ID for rate limiting authenticated users
    const { allowed, remaining } = await checkRateLimit(adminClient, user.id)

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

    // ========================================
    // 4. PARSE AND VALIDATE REQUEST
    // ========================================
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

    // ========================================
    // 5. CREATE POSTER PROFILE (for display purposes)
    // ========================================
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

    const posterProfileId = profileData.id

    // ========================================
    // 6. CREATE PROFILE CONTACT (private)
    // ========================================
    const { error: contactError } = await adminClient.from('profile_contacts').insert({
      profile_id: posterProfileId,
      contact_preference: profile.contactPreference,
      contact_value: profile.contactValue.trim(),
    })

    if (contactError) {
      console.error('Error creating contact:', contactError)
      // Clean up profile
      await adminClient.from('poster_profiles').delete().eq('id', posterProfileId)
      return NextResponse.json({ ok: false, error: 'Failed to save contact information' }, { status: 500 })
    }

    // ========================================
    // 7. CREATE LISTING (with user_id for ownership)
    // ========================================
    const { data: listingData, error: listingError } = await adminClient
      .from('listings')
      .insert({
        user_id: user.id, // Associate with authenticated user for ownership
        poster_profile_id: posterProfileId,
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
        full_address: listing.fullAddress?.trim() || null, // Store full address privately
        is_active: true,
      })
      .select('id')
      .single()

    if (listingError || !listingData) {
      console.error('Error creating listing:', listingError)
      // Clean up profile and contact
      await adminClient.from('profile_contacts').delete().eq('profile_id', posterProfileId)
      await adminClient.from('poster_profiles').delete().eq('id', posterProfileId)
      return NextResponse.json({ ok: false, error: 'Failed to create listing' }, { status: 500 })
    }

    const listingId = listingData.id

    // ========================================
    // 8. INSERT LISTING PHOTOS (if provided)
    // ========================================
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
