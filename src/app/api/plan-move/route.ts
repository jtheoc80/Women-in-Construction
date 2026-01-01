import { NextRequest, NextResponse } from 'next/server'
import {
  getJobsiteBySlug,
  getHubMetrics,
  getJobsiteMetrics,
  getListingsForJobsite,
  rankHubs,
  type PlanMoveResponse,
} from '@/lib/supabase'

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
      listings: [],
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
    listings: [
      {
        id: 'mock-1',
        user_id: 'demo_user_1',
        city: `${jobsite.city}, ${jobsite.state}`,
        area: hubs[0]?.name || 'Downtown',
        rent_min: 850,
        rent_max: 1000,
        move_in: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        room_type: 'private_room',
        commute_area: jobsite.name,
        details: 'Clean, quiet apartment. Looking for a roommate who works similar shifts. Non-smoker preferred.',
        is_active: true,
        created_at: new Date().toISOString(),
        jobsite_id: 'mock-jobsite',
        hub_id: 'mock-hub-0',
        shift: 'day',
        cover_photo_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        photo_urls: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
        ],
        profiles: { display_name: 'Sarah M.' },
      },
      {
        id: 'mock-2',
        user_id: 'demo_user_2',
        city: `${jobsite.city}, ${jobsite.state}`,
        area: hubs[1]?.name || 'Suburb',
        rent_min: 700,
        rent_max: 850,
        move_in: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        room_type: 'shared_room',
        commute_area: jobsite.name,
        details: 'Sharing a house with other tradeswomen. Great location and affordable rent.',
        is_active: true,
        created_at: new Date().toISOString(),
        jobsite_id: 'mock-jobsite',
        hub_id: 'mock-hub-1',
        shift: 'swing',
        cover_photo_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        photo_urls: [
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
          'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
        ],
        profiles: { display_name: 'Jessica R.' },
      },
      {
        id: 'mock-3',
        user_id: 'demo_user_3',
        city: `${jobsite.city}, ${jobsite.state}`,
        area: hubs[2]?.name || 'East Side',
        rent_min: 650,
        rent_max: 800,
        move_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        room_type: 'private_room',
        commute_area: jobsite.name,
        details: 'Private room available. I work nights so place is quiet during the day.',
        is_active: true,
        created_at: new Date().toISOString(),
        jobsite_id: 'mock-jobsite',
        hub_id: 'mock-hub-2',
        shift: 'night',
        cover_photo_url: null, // No photo - will show badge
        photo_urls: null,
        profiles: { display_name: 'Amanda K.' },
      },
    ],
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
      listings_14d: 3,
      avg_response_hours: 8.5,
      is_scarce: true,
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
    const listings = await getListingsForJobsite(activeJobsiteId, {
      hub_ids: topHubIds.length > 0 ? topHubIds : undefined,
      budget_min,
      budget_max,
      room_type,
      shift,
      move_in_date,
    })

    // Get jobsite-level metrics for scarcity indicators
    const jobsiteMetrics = await getJobsiteMetrics(activeJobsiteId)

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
    const listings = await getListingsForJobsite(jobsite.id)
    const jobsiteMetrics = await getJobsiteMetrics(jobsite.id)

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
