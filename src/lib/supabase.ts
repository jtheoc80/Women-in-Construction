// Supabase client utilities for the Jobsite Housing Explorer

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Types for the database schema
export interface Jobsite {
  id: string
  name: string
  city: string
  state: string
  slug: string
  lat?: number
  lng?: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Hub {
  id: string
  jobsite_id: string
  name: string
  commute_min: number
  commute_max: number
  description?: string
  created_at: string
}

export interface HubMetrics {
  hub_id: string
  jobsite_id: string
  hub_name: string
  commute_min: number
  commute_max: number
  listing_count_30d: number
  listing_count_14d: number
  median_rent_min: number | null
  median_rent_max: number | null
  median_response_hours: number | null
}

export interface JobsiteMetrics {
  jobsite_id: string
  slug: string
  jobsite_name: string
  city: string
  state: string
  listings_14d: number
  avg_response_hours: number | null
  total_active_listings: number
}

export interface Listing {
  id: string
  user_id: string
  city: string
  area: string | null
  rent_min: number | null
  rent_max: number | null
  move_in: string | null
  room_type: string
  commute_area: string | null
  details: string | null
  is_active: boolean
  created_at: string
  jobsite_id: string | null
  hub_id: string | null
  shift: string | null
  cover_photo_url: string | null
  photo_urls: string[] | null
  profiles?: {
    display_name: string
  }
}

export interface MovePlan {
  id: string
  user_id: string
  jobsite_id: string
  budget_min: number | null
  budget_max: number | null
  commute_max: number
  shift: string
  room_type: string
  move_in_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Plan Move request/response types
export interface PlanMoveRequest {
  jobsite_id: string
  budget_min?: number
  budget_max?: number
  commute_max: number
  room_type?: string
  shift?: string
  move_in_date?: string
}

export interface RankedHub extends HubMetrics {
  score: number
  budget_match: boolean
}

export interface PlanMoveResponse {
  hubs: RankedHub[]
  listings: Listing[]
  jobsite: Jobsite | null
  scarcity: {
    listings_14d: number
    avg_response_hours: number | null
    is_scarce: boolean
  }
}

// Base fetch utility for Supabase REST API
async function supabaseFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase not configured')
  }

  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Supabase error: ${error}`)
  }

  return res.json()
}

// Fetch all active jobsites
export async function getJobsites(): Promise<Jobsite[]> {
  return supabaseFetch<Jobsite[]>('jobsites?is_active=eq.true&order=name.asc')
}

// Fetch single jobsite by slug
export async function getJobsiteBySlug(slug: string): Promise<Jobsite | null> {
  const results = await supabaseFetch<Jobsite[]>(
    `jobsites?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true`
  )
  return results[0] || null
}

// Fetch hubs for a jobsite
export async function getHubsForJobsite(jobsiteId: string): Promise<Hub[]> {
  return supabaseFetch<Hub[]>(
    `hubs?jobsite_id=eq.${jobsiteId}&order=commute_min.asc`
  )
}

// Fetch hub metrics (from view)
export async function getHubMetrics(jobsiteId: string): Promise<HubMetrics[]> {
  return supabaseFetch<HubMetrics[]>(
    `hub_metrics_30d?jobsite_id=eq.${jobsiteId}&order=listing_count_30d.desc`
  )
}

// Fetch jobsite metrics (from view)
export async function getJobsiteMetrics(
  jobsiteId: string
): Promise<JobsiteMetrics | null> {
  const results = await supabaseFetch<JobsiteMetrics[]>(
    `jobsite_metrics?jobsite_id=eq.${jobsiteId}`
  )
  return results[0] || null
}

// Fetch listings for a jobsite with optional filters
export async function getListingsForJobsite(
  jobsiteId: string,
  filters?: {
    hub_ids?: string[]
    budget_min?: number
    budget_max?: number
    room_type?: string
    shift?: string
    move_in_date?: string
  }
): Promise<Listing[]> {
  let query = `listings?select=*,profiles(display_name)&jobsite_id=eq.${jobsiteId}&is_active=eq.true&order=created_at.desc`

  if (filters?.hub_ids && filters.hub_ids.length > 0) {
    query += `&hub_id=in.(${filters.hub_ids.join(',')})`
  }
  if (filters?.budget_max) {
    query += `&rent_min=lte.${filters.budget_max}`
  }
  if (filters?.budget_min) {
    query += `&rent_max=gte.${filters.budget_min}`
  }
  if (filters?.room_type && filters.room_type !== 'all') {
    query += `&room_type=eq.${filters.room_type}`
  }
  if (filters?.shift && filters.shift !== 'all') {
    query += `&shift=eq.${filters.shift}`
  }
  if (filters?.move_in_date) {
    query += `&move_in=gte.${filters.move_in_date}`
  }

  return supabaseFetch<Listing[]>(query)
}

// Get recent listings (photo-forward, for display)
export async function getRecentListings(
  jobsiteId: string,
  limit: number = 12
): Promise<Listing[]> {
  return supabaseFetch<Listing[]>(
    `listings?select=*,profiles(display_name)&jobsite_id=eq.${jobsiteId}&is_active=eq.true&order=created_at.desc&limit=${limit}`
  )
}

// Hub ranking algorithm
export function rankHubs(
  hubs: HubMetrics[],
  filters: {
    budget_min?: number
    budget_max?: number
    commute_max: number
  }
): RankedHub[] {
  return hubs
    .filter((hub) => hub.commute_max <= filters.commute_max)
    .map((hub) => {
      let score = 0

      // Inventory score (0-40 points)
      // More listings = higher score
      const inventoryScore = Math.min(hub.listing_count_30d * 4, 40)
      score += inventoryScore

      // Budget match score (0-30 points)
      let budgetMatch = true
      if (filters.budget_min && filters.budget_max && hub.median_rent_min) {
        const hubMidRent =
          ((hub.median_rent_min || 0) + (hub.median_rent_max || 0)) / 2
        const userMidBudget = (filters.budget_min + filters.budget_max) / 2
        const diff = Math.abs(hubMidRent - userMidBudget)

        if (diff <= 100) {
          score += 30
        } else if (diff <= 200) {
          score += 20
        } else if (diff <= 300) {
          score += 10
        } else {
          budgetMatch = false
        }
      } else {
        score += 15 // Default if no rent data
      }

      // Commute score (0-20 points)
      // Shorter commute = higher score
      const commuteScore = Math.max(0, 20 - hub.commute_min / 3)
      score += commuteScore

      // Response time score (0-10 points)
      // Faster response = higher score
      if (hub.median_response_hours !== null) {
        if (hub.median_response_hours <= 2) {
          score += 10
        } else if (hub.median_response_hours <= 6) {
          score += 7
        } else if (hub.median_response_hours <= 12) {
          score += 4
        } else if (hub.median_response_hours <= 24) {
          score += 2
        }
      } else {
        score += 5 // Default if no response data
      }

      return {
        ...hub,
        score,
        budget_match: budgetMatch,
      }
    })
    .sort((a, b) => b.score - a.score)
}

// Save a move plan
export async function saveMovePlan(plan: Omit<MovePlan, 'id' | 'created_at' | 'updated_at'>): Promise<MovePlan> {
  const result = await supabaseFetch<MovePlan[]>('move_plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  })
  return result[0]
}
