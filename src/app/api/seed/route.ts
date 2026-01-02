import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { seedProfiles, seedListings } from '@/lib/seed-data'

// Only allow in development or with secret key
const SEED_SECRET = process.env.SEED_SECRET || 'development-seed-secret'
const isDev = process.env.NODE_ENV === 'development'

/**
 * POST /api/seed
 * 
 * Seeds the database with demo listings data.
 * Requires either:
 * - Running in development mode, OR
 * - Providing the correct SEED_SECRET in the Authorization header
 * 
 * Query params:
 * - clear=true: Clears existing demo data before seeding
 */
export async function POST(req: NextRequest) {
  // Check authorization
  const authHeader = req.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')
  
  if (!isDev && providedSecret !== SEED_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized. Seed endpoint only available in development or with valid SEED_SECRET.' },
      { status: 401 }
    )
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const url = new URL(req.url)
  const shouldClear = url.searchParams.get('clear') === 'true'

  try {
    const results: { step: string; success: boolean; details?: string; error?: string }[] = []

    // Step 0: Clear existing demo data if requested
    if (shouldClear) {
      // Delete demo users (cascades to profiles, listings, etc.)
      for (const profile of seedProfiles) {
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === profile.email)
        if (existingUser) {
          await supabase.auth.admin.deleteUser(existingUser.id)
        }
      }
      results.push({ step: 'Clear existing demo data', success: true })
    }

    // Step 1: Create demo users via Supabase Auth
    const createdUsers: { id: string; email: string; profileIndex: number }[] = []

    for (let i = 0; i < seedProfiles.length; i++) {
      const profile = seedProfiles[i]
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === profile.email)
      
      if (existingUser) {
        createdUsers.push({ id: existingUser.id, email: profile.email, profileIndex: i })
        results.push({ 
          step: `Create user ${profile.email}`, 
          success: true, 
          details: 'User already exists' 
        })
        continue
      }

      // Create new user
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: 'DemoPassword123!', // Demo password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: profile.firstName,
        },
      })

      if (userError) {
        results.push({ 
          step: `Create user ${profile.email}`, 
          success: false, 
          error: userError.message 
        })
        continue
      }

      if (newUser.user) {
        createdUsers.push({ id: newUser.user.id, email: profile.email, profileIndex: i })
        results.push({ 
          step: `Create user ${profile.email}`, 
          success: true,
          details: `User ID: ${newUser.user.id}` 
        })
      }
    }

    // Step 2: Update profiles with additional info
    for (const user of createdUsers) {
      const profile = seedProfiles[user.profileIndex]
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: profile.firstName,
          first_name: profile.firstName,
          home_city: profile.homeCity,
          company: profile.company,
          role: profile.role,
          bio: profile.bio,
        })
        .eq('id', user.id)

      results.push({
        step: `Update profile for ${profile.email}`,
        success: !profileError,
        error: profileError?.message,
      })
    }

    // Step 3: Create poster profiles and listings
    const posterProfileIds: { [key: number]: string } = {}

    for (const user of createdUsers) {
      const profile = seedProfiles[user.profileIndex]
      
      // Check if poster profile already exists
      const { data: existingPoster } = await supabase
        .from('poster_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingPoster) {
        posterProfileIds[user.profileIndex] = existingPoster.id
        results.push({
          step: `Create poster profile for ${profile.email}`,
          success: true,
          details: 'Poster profile already exists',
        })
        continue
      }

      // Create poster profile
      const { data: posterProfile, error: posterError } = await supabase
        .from('poster_profiles')
        .insert({
          user_id: user.id,
          display_name: profile.firstName,
          company: profile.company,
          role: profile.role,
        })
        .select('id')
        .single()

      if (posterError) {
        results.push({
          step: `Create poster profile for ${profile.email}`,
          success: false,
          error: posterError.message,
        })
        continue
      }

      posterProfileIds[user.profileIndex] = posterProfile.id
      results.push({
        step: `Create poster profile for ${profile.email}`,
        success: true,
      })
    }

    // Step 4: Create listings
    let listingsCreated = 0

    for (const listing of seedListings) {
      const user = createdUsers.find(u => u.profileIndex === listing.profileIndex)
      if (!user) {
        results.push({
          step: `Create listing in ${listing.city}`,
          success: false,
          error: 'No user found for this listing',
        })
        continue
      }

      const posterProfileId = posterProfileIds[listing.profileIndex]
      if (!posterProfileId) {
        results.push({
          step: `Create listing in ${listing.city}`,
          success: false,
          error: 'No poster profile found',
        })
        continue
      }

      // Calculate move-in date
      const moveInDate = new Date()
      moveInDate.setDate(moveInDate.getDate() + listing.moveInDays)

      // Check if a similar listing already exists
      const { data: existingListing } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', user.id)
        .eq('city', listing.city)
        .eq('area', listing.area)
        .single()

      if (existingListing) {
        results.push({
          step: `Create listing in ${listing.city} (${listing.area})`,
          success: true,
          details: 'Listing already exists',
        })
        listingsCreated++
        continue
      }

      // Create the listing
      const { data: newListing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          poster_profile_id: posterProfileId,
          city: listing.city,
          area: listing.area,
          rent_min: listing.rentMin,
          rent_max: listing.rentMax,
          move_in: moveInDate.toISOString().split('T')[0],
          room_type: listing.roomType,
          commute_area: listing.commuteArea,
          details: listing.details,
          is_active: true,
        })
        .select('id')
        .single()

      if (listingError) {
        results.push({
          step: `Create listing in ${listing.city} (${listing.area})`,
          success: false,
          error: listingError.message,
        })
        continue
      }

      listingsCreated++

      // Step 5: Create listing photos
      if (listing.photoUrls.length > 0 && newListing) {
        const photoRecords = listing.photoUrls.map((url, index) => ({
          listing_id: newListing.id,
          storage_path: url, // Using external URLs directly
          sort_order: index,
        }))

        const { error: photoError } = await supabase
          .from('listing_photos')
          .insert(photoRecords)

        results.push({
          step: `Add ${listing.photoUrls.length} photos to listing in ${listing.city}`,
          success: !photoError,
          error: photoError?.message,
        })
      }

      results.push({
        step: `Create listing in ${listing.city} (${listing.area})`,
        success: true,
      })
    }

    return NextResponse.json({
      success: true,
      summary: {
        usersCreated: createdUsers.length,
        listingsCreated,
      },
      results,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/seed
 * Returns information about the seed endpoint
 */
export async function GET() {
  return NextResponse.json({
    description: 'Seed endpoint for populating demo data',
    usage: 'POST /api/seed to seed the database',
    params: {
      'clear=true': 'Clear existing demo data before seeding',
    },
    authorization: isDev 
      ? 'No authorization required in development mode'
      : 'Requires Bearer token with SEED_SECRET',
  })
}
