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
  profile?: unknown // Legacy field, ignored
  listing: ListingInput
  photoPaths?: string[]
  website?: string // honeypot
}

function toPublicListingPhotoUrl(storagePathOrUrl: string): string {
  const val = storagePathOrUrl.trim()
  if (val === '') return ''
  if (val.startsWith('http://') || val.startsWith('https://')) return val
  if (!supabaseUrl) return val
  return `${supabaseUrl}/storage/v1/object/public/listing-photos/${val}`
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
 * Fetch all active listings with related profile data and photo fields stored on listings
 * 
 * PUBLIC ENDPOINT - No authentication required
 * 
 * Response: Array of listings with poster_profiles, cover_photo_url, photo_urls
 */
export async function GET() {
  console.log('[Listings GET] Fetching active listings...')
  
  try {
    // Check if Supabase is configured
    if (!supabaseUrl) {
      console.log('[Listings GET] Supabase not configured, returning empty array')
      return NextResponse.json([])
    }

    let adminClient
    try {
      adminClient = createAdminClient()
    } catch (clientError) {
      console.error('[Listings GET] Failed to create admin client:', clientError)
      // Return empty array instead of error for graceful degradation
      return NextResponse.json([])
    }

    // Fetch listings with profile info
    // Try to join with profiles table (for authenticated user display names)
    const { data: listings, error } = await adminClient
      .from('listings')
      .select(`
        id,
        user_id,
        title,
        city,
        area,
        rent_min,
        rent_max,
        move_in,
        room_type,
        commute_area,
        details,
        tags,
        place_id,
        lat,
        lng,
        is_active,
        created_at,
        cover_photo_url,
        photo_urls,
        profiles:user_id (
          id,
          display_name,
          first_name
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Listings GET] Error fetching listings with profile join:', error.message)
      
      // Fallback: try without the join if it failed
      console.log('[Listings GET] Attempting fallback query without profiles join...')
      const { data: fallbackListings, error: fallbackError } = await adminClient
        .from('listings')
        .select(`
          id,
          user_id,
          title,
          city,
          area,
          rent_min,
          rent_max,
          move_in,
          room_type,
          commute_area,
          details,
          tags,
          place_id,
          lat,
          lng,
          is_active,
          created_at,
          cover_photo_url,
          photo_urls
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (fallbackError) {
        console.error('[Listings GET] Fallback query also failed:', fallbackError.message)
        return NextResponse.json(
          { ok: false, error: 'Failed to fetch listings' },
          { status: 500 }
        )
      }

      console.log(`[Listings GET] Fallback success: ${fallbackListings?.length || 0} listings`)
      return NextResponse.json(fallbackListings || [])
    }

    console.log(`[Listings GET] Success: ${listings?.length || 0} listings`)
    return NextResponse.json(listings || [])
  } catch (error) {
    console.error('[Listings GET] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch listings' },
      { status: 500 }
    )
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

    const { listing, photoPaths } = validation.data
    const allPhotoUrls = (photoPaths || [])
      .map(toPublicListingPhotoUrl)
      .filter(Boolean)
    const coverPhotoUrl = allPhotoUrls[0] || null
    const photoUrls = allPhotoUrls.length > 1 ? allPhotoUrls.slice(1) : null

    // ========================================
    // 5. CREATE LISTING (with user_id for ownership)
    // ========================================
    console.log('[Listings POST] Creating listing for user:', user.id)
    
    const { data: listingData, error: listingError } = await adminClient
      .from('listings')
      .insert({
        user_id: user.id, // Associate with authenticated user for ownership
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
        cover_photo_url: coverPhotoUrl,
        photo_urls: photoUrls,
        is_active: true,
      })
      .select('id')
      .single()

    if (listingError || !listingData) {
      console.error('[Listings POST] Error creating listing:', listingError)
      return NextResponse.json({ ok: false, error: 'Failed to create listing' }, { status: 500 })
    }

    const listingId = listingData.id

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
