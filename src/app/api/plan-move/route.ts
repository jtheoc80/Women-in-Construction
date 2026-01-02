import { NextRequest, NextResponse } from 'next/server'
import {
  getJobsiteBySlug,
  getHubMetrics,
  getJobsiteMetrics,
  getListingsForJobsite,
  rankHubs,
  type PlanMoveResponse,
  type Listing,
} from '@/lib/supabase'
import { DEMO_LISTINGS } from '@/lib/demo-data'

/**
 * Convert demo listings to the Listing type format expected by the API response.
 * This ensures demo listings have consistent photo fields that work on both
 * SSR and CSR, preventing hydration mismatches.
 */
function getDemoListingsForResponse(): Listing[] {
  return DEMO_LISTINGS.map(demo => ({
    id: demo.id || `demo-${Date.now()}`,
    user_id: demo.user_id || 'demo-user',
    city: demo.city || 'Unknown',
    area: demo.area || null,
    rent_min: demo.rent_min ?? null,
    rent_max: demo.rent_max ?? null,
    move_in: demo.move_in || null,
    room_type: demo.room_type || 'private_room',
    commute_area: demo.commute_area || null,
    details: demo.details || null,
    is_active: true,
    created_at: demo.created_at || new Date().toISOString(),
    jobsite_id: null,
    hub_id: null,
    shift: null,
    // CRITICAL: Always include photo fields from demo data
    cover_photo_url: demo.cover_photo_url || null,
    photo_urls: demo.photo_urls || null,
    profiles: demo.poster_profiles ? {
      display_name: demo.poster_profiles.display_name || 'Anonymous'
    } : undefined,
  }))
}

// Mock data for when Supabase is not configured
function getMockResponse(jobsiteSlug: string): PlanMoveResponse {
  const mockJobsites: Record<string, { name: string; city: string; state: string }> = {
    'tsmc-arizona': { name: 'TSMC Arizona', city: 'Phoenix', state: 'AZ' },
    'intel-ocotillo': { name: 'Intel Ocotillo', city: 'Chandler', state: 'AZ' },
    'samsung-taylor': { name: 'Samsung Taylor', city: 'Taylor', state: 'TX' },
    'intel-ohio': { name: 'Intel Ohio', city: 'New Albany', state: 'OH' },
    'micron-boise': { name: 'Micron Boise', city: 'Boise', state: 'ID' },
  }

  const mockHubs: Record<string, Array<{ name: string; commute_min: number; commute_max: number }>> = {
    'tsmc-arizona': [
      { name: 'North Phoenix', commute_min: 10, commute_max: 20 },
      { name: 'Deer Valley', commute_min: 15, commute_max: 25 },
      { name: 'Glendale', commute_min: 20, commute_max: 35 },
      { name: 'Peoria', commute_min: 25, commute_max: 40 },
      { name: 'Scottsdale', commute_min: 30, commute_max: 45 },
    ],
    'intel-ocotillo': [
      { name: 'Chandler', commute_min: 5, commute_max: 15 },
      { name: 'Gilbert', commute_min: 10, commute_max: 20 },
      { name: 'Mesa', commute_min: 15, commute_max: 25 },
      { name: 'Tempe', commute_min: 15, commute_max: 30 },
      { name: 'Queen Creek', commute_min: 20, commute_max: 35 },
    ],
    'samsung-taylor': [
      { name: 'Taylor', commute_min: 0, commute_max: 15 },
      { name: 'Hutto', commute_min: 15, commute_max: 25 },
      { name: 'Round Rock', commute_min: 20, commute_max: 35 },
      { name: 'Pflugerville', commute_min: 20, commute_max: 35 },
      { name: 'Georgetown', commute_min: 30, commute_max: 45 },
    ],
    'intel-ohio': [
      { name: 'New Albany', commute_min: 5, commute_max: 15 },
      { name: 'Johnstown', commute_min: 10, commute_max: 20 },
      { name: 'Westerville', commute_min: 15, commute_max: 30 },
      { name: 'Gahanna', commute_min: 15, commute_max: 25 },
      { name: 'Columbus - Easton', commute_min: 20, commute_max: 35 },
    ],
    'micron-boise': [
      { name: 'Boise - Downtown', commute_min: 5, commute_max: 15 },
      { name: 'Boise - Bench', commute_min: 10, commute_max: 20 },
      { name: 'Garden City', commute_min: 10, commute_max: 20 },
      { name: 'Meridian', commute_min: 15, commute_max: 30 },
      { name: 'Eagle', commute_min: 20, commute_max: 35 },
    ],
  }

  const jobsite = mockJobsites[jobsiteSlug]
  const hubs = mockHubs[jobsiteSlug] || []

  if (!jobsite) {
    return {
      hubs: [],
      // Always include demo listings with stable local photos
      listings: getDemoListingsForResponse(),
      jobsite: null,
      scarcity: { listings_14d: 0, avg_response_hours: null, is_scarce: true },
    }
  }

  return {
    hubs: hubs.map((h, i) => ({
      hub_id: `mock-hub-${i}`,
      jobsite_id: `mock-jobsite`,
      hub_name: h.name,
      commute_min: h.commute_min,
      commute_max: h.commute_max,
      listing_count_30d: Math.floor(Math.random() * 5) + 1,
      listing_count_14d: Math.floor(Math.random() * 3),
      median_rent_min: 700 + Math.floor(Math.random() * 300),
      median_rent_max: 900 + Math.floor(Math.random() * 400),
      median_response_hours: Math.random() * 24,
      score: 80 - i * 10,
      budget_match: true,
    })),
    // Use demo listings with stable local photos instead of random Unsplash URLs
    listings: getDemoListingsForResponse(),
    jobsite: {
      id: 'mock-jobsite',
      name: jobsite.name,
      city: jobsite.city,
      state: jobsite.state,
      slug: jobsiteSlug,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    scarcity: {
      listings_14d: getDemoListingsForResponse().length,
      avg_response_hours: 8.5,
      is_scarce: false,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jobsite_id,
      jobsite_slug,
      budget_min,
      budget_max,
      commute_max = 30,
      room_type,
      shift,
      move_in_date,
    } = body

    // If Supabase not configured, return mock data
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const mockResponse = getMockResponse(jobsite_slug || 'tsmc-arizona')
      
      // Filter hubs by commute_max
      mockResponse.hubs = mockResponse.hubs.filter(
        (h) => h.commute_max <= commute_max
      )
      
      return NextResponse.json(mockResponse)
    }

    // Get jobsite
    let jobsite = null
    if (jobsite_slug) {
      jobsite = await getJobsiteBySlug(jobsite_slug)
    }

    if (!jobsite && !jobsite_id) {
      return NextResponse.json(
        { error: 'Jobsite not found' },
        { status: 404 }
      )
    }

    const activeJobsiteId = jobsite?.id || jobsite_id

    // Get hub metrics and rank them
    const hubMetrics = await getHubMetrics(activeJobsiteId)
    const rankedHubs = rankHubs(hubMetrics, {
      budget_min,
      budget_max,
      commute_max,
    })

    // Get top hub IDs for listing filter
    const topHubIds = rankedHubs.slice(0, 5).map((h) => h.hub_id)

    // Get filtered listings
    const dbListings = await getListingsForJobsite(activeJobsiteId, {
      hub_ids: topHubIds.length > 0 ? topHubIds : undefined,
      budget_min,
      budget_max,
      room_type,
      shift,
      move_in_date,
    })

    // Get jobsite-level metrics for scarcity indicators
    const jobsiteMetrics = await getJobsiteMetrics(activeJobsiteId)

    // Merge DB listings with demo listings
    // Demo listings are always included to ensure there's always content with photos
    const demoListings = getDemoListingsForResponse()
    
    // Create a set of DB listing IDs to avoid duplicates
    const dbListingIds = new Set(dbListings.map(l => l.id))
    
    // Filter out demo listings that might conflict with DB listings (by ID)
    const filteredDemoListings = demoListings.filter(d => !dbListingIds.has(d.id))
    
    // Combine: DB listings first, then demo listings
    const listings = [...dbListings, ...filteredDemoListings]

    const response: PlanMoveResponse = {
      hubs: rankedHubs,
      listings,
      jobsite,
      scarcity: {
        listings_14d: jobsiteMetrics?.listings_14d || 0,
        avg_response_hours: jobsiteMetrics?.avg_response_hours || null,
        is_scarce: (jobsiteMetrics?.listings_14d || 0) < 5,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Plan move error:', error)
    return NextResponse.json(
      { error: 'Failed to process plan move request' },
      { status: 500 }
    )
  }
}

// GET endpoint for simple queries without filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const commuteMax = parseInt(searchParams.get('commute_max') || '60')

  if (!slug) {
    return NextResponse.json(
      { error: 'Jobsite slug required' },
      { status: 400 }
    )
  }

  // If Supabase not configured, return mock data
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const mockResponse = getMockResponse(slug)
    mockResponse.hubs = mockResponse.hubs.filter((h) => h.commute_max <= commuteMax)
    return NextResponse.json(mockResponse)
  }

  try {
    const jobsite = await getJobsiteBySlug(slug)
    if (!jobsite) {
      return NextResponse.json(
        { error: 'Jobsite not found' },
        { status: 404 }
      )
    }

    const hubMetrics = await getHubMetrics(jobsite.id)
    const rankedHubs = rankHubs(hubMetrics, { commute_max: commuteMax })
    const dbListings = await getListingsForJobsite(jobsite.id)
    const jobsiteMetrics = await getJobsiteMetrics(jobsite.id)

    // Merge DB listings with demo listings
    const demoListings = getDemoListingsForResponse()
    const dbListingIds = new Set(dbListings.map(l => l.id))
    const filteredDemoListings = demoListings.filter(d => !dbListingIds.has(d.id))
    const listings = [...dbListings, ...filteredDemoListings]

    const response: PlanMoveResponse = {
      hubs: rankedHubs,
      listings,
      jobsite,
      scarcity: {
        listings_14d: jobsiteMetrics?.listings_14d || 0,
        avg_response_hours: jobsiteMetrics?.avg_response_hours || null,
        is_scarce: (jobsiteMetrics?.listings_14d || 0) < 5,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Plan move GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobsite data' },
      { status: 500 }
    )
  }
}
