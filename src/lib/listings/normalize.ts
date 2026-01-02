/**
 * Listing data normalization layer
 * 
 * This module provides a single source of truth for listing card data,
 * normalizing both DB records and demo data into a consistent shape.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Normalized model for listing cards - UI consumes ONLY this shape
 */
export interface ListingCardModel {
  id: string
  titleCity: string              // "Ashburn" or "Phoenix, AZ"
  subLocation: string | null     // "Loudoun County" or "Chandler" or null
  roomType: 'Private Room' | 'Shared Room' | 'Entire Place' | string
  roomTypeRaw: string            // original value for filtering: 'private_room', etc.
  isDemo: boolean
  priceText: string              // "$800 - $950/mo" or "$800/mo" or "Contact for price"
  nearText: string | null        // "Near Data Center Alley" or null (not rendered if null)
  moveInText: string | null      // "Move-in: Jan 2, 2026" or null (not rendered if null)
  postedByText: string | null    // "Sarah M." or null
  companyText: string | null     // "Turner Construction" or null
  coverPhotoUrl: string | null   // Full URL to cover photo or null
  photoCount: number             // Total number of photos (0 if none)
  photoUrls: string[]            // All photo URLs (for gallery view)
  // Pass through for detail page linking
  rawId: string
}

/**
 * Raw listing shape from API/DB - accepts various field name conventions
 */
export interface RawListing {
  id?: string
  user_id?: string
  poster_profile_id?: string | null
  title?: string | null
  city?: string
  area?: string | null
  rent_min?: number | null
  rent_max?: number | null
  rentMin?: number | null
  rentMax?: number | null
  move_in?: string | null
  moveIn?: string | null
  move_in_date?: string | null
  room_type?: string
  roomType?: string
  commute_area?: string | null
  commuteArea?: string | null
  near_label?: string | null
  nearLabel?: string | null
  details?: string | null
  tags?: string[] | null
  is_active?: boolean
  created_at?: string
  // Photo fields - various conventions
  cover_photo_url?: string | null
  coverPhotoUrl?: string | null
  photo_urls?: string[] | null
  photoUrls?: string[] | null
  photos?: string[] | null
  photo_paths?: string[] | null
  // Poster profile - nested object
  poster_profiles?: {
    id?: string
    display_name?: string
    company?: string
    role?: string | null
  } | null
  // Alternative profile formats
  profiles?: {
    display_name?: string
  } | null
  host_name?: string | null
  posted_by_name?: string | null
  company_name?: string | null
  company?: string | null
  // Demo flag
  is_demo?: boolean
  isDemo?: boolean
}

/**
 * Format room type from DB value to display value
 */
function formatRoomType(type: string | undefined): string {
  switch (type) {
    case 'private_room': return 'Private Room'
    case 'shared_room': return 'Shared Room'
    case 'entire_place': return 'Entire Place'
    default: return type || 'Room'
  }
}

/**
 * Format date to "MMM D, YYYY" (e.g., "Jan 2, 2026")
 */
function formatMoveInDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return null
  }
}

/**
 * Format price range to display text
 */
function formatPriceText(min: number | null | undefined, max: number | null | undefined): string {
  const hasMin = min != null && min > 0
  const hasMax = max != null && max > 0
  
  if (hasMin && hasMax) {
    if (min === max) {
      return `$${min.toLocaleString()}/mo`
    }
    return `$${min.toLocaleString()} - $${max.toLocaleString()}/mo`
  }
  
  if (hasMin) {
    return `$${min.toLocaleString()}/mo`
  }
  
  if (hasMax) {
    return `$${max.toLocaleString()}/mo`
  }
  
  return 'Contact for price'
}

/**
 * Normalize a photo URL or storage path to a full URL
 */
export function normalizePhotoUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null
  
  const val = urlOrPath.trim()
  if (!val) return null
  
  // Already a full URL
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val
  }
  
  // Local path (e.g., /demo/listings/1.jpg)
  if (val.startsWith('/')) {
    return val
  }
  
  // Supabase storage path - convert to public URL
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${val}`
  }
  
  return null
}

/**
 * Extract all photo URLs from raw listing data
 * Handles various field conventions and deduplicates
 */
function extractPhotoUrls(raw: RawListing): string[] {
  const urls: (string | null)[] = []
  
  // Cover photo first (various field names)
  urls.push(normalizePhotoUrl(raw.cover_photo_url))
  urls.push(normalizePhotoUrl(raw.coverPhotoUrl))
  
  // Photo arrays (various field names)
  const photoArrays = [
    raw.photo_urls,
    raw.photoUrls,
    raw.photos,
    raw.photo_paths
  ]
  
  for (const arr of photoArrays) {
    if (Array.isArray(arr)) {
      for (const url of arr) {
        urls.push(normalizePhotoUrl(url))
      }
    }
  }
  
  // Filter nulls and deduplicate
  const validUrls = urls.filter((x): x is string => Boolean(x))
  return Array.from(new Set(validUrls))
}

/**
 * Extract posted by name from various sources
 */
function extractPostedByName(raw: RawListing): string | null {
  // Priority: poster_profiles.display_name > profiles.display_name > host_name > posted_by_name
  if (raw.poster_profiles?.display_name) {
    return raw.poster_profiles.display_name
  }
  if (raw.profiles?.display_name) {
    return raw.profiles.display_name
  }
  if (raw.host_name) {
    return raw.host_name
  }
  if (raw.posted_by_name) {
    return raw.posted_by_name
  }
  return null
}

/**
 * Extract company name from various sources
 */
function extractCompanyName(raw: RawListing): string | null {
  if (raw.poster_profiles?.company) {
    return raw.poster_profiles.company
  }
  if (raw.company_name) {
    return raw.company_name
  }
  if (raw.company) {
    return raw.company
  }
  return null
}

/**
 * Normalize a raw listing record into ListingCardModel
 * 
 * @param raw - Raw listing from DB or demo data
 * @returns Normalized ListingCardModel for UI consumption
 */
export function normalizeListing(raw: RawListing): ListingCardModel {
  const id = raw.id || `unknown-${Date.now()}`
  const isDemo = raw.is_demo === true || raw.isDemo === true
  
  // Extract city - required field
  const city = raw.city || 'Unknown Location'
  
  // Extract area/sublocation
  const area = raw.area || null
  
  // Get room type with fallback
  const roomTypeRaw = raw.room_type || raw.roomType || 'private_room'
  const roomType = formatRoomType(roomTypeRaw)
  
  // Get price info - try various field names
  const rentMin = raw.rent_min ?? raw.rentMin ?? null
  const rentMax = raw.rent_max ?? raw.rentMax ?? null
  const priceText = formatPriceText(rentMin, rentMax)
  
  // Get commute/near text - try various field names
  const commuteArea = raw.commute_area || raw.commuteArea || raw.near_label || raw.nearLabel || null
  const nearText = commuteArea ? `Near ${commuteArea}` : null
  
  // Get move-in date - try various field names
  const moveInRaw = raw.move_in || raw.moveIn || raw.move_in_date || null
  const moveInFormatted = formatMoveInDate(moveInRaw)
  const moveInText = moveInFormatted ? `Move-in: ${moveInFormatted}` : null
  
  // Get poster info
  const postedByText = extractPostedByName(raw)
  const companyText = extractCompanyName(raw)
  
  // Get photos
  const photoUrls = extractPhotoUrls(raw)
  const coverPhotoUrl = photoUrls[0] || null
  const photoCount = photoUrls.length
  
  // DEV-ONLY: Log warning for missing critical fields in demo/seed data
  if (process.env.NODE_ENV === 'development') {
    const missingFields: string[] = []
    
    if (!raw.city) missingFields.push('city')
    if (rentMin == null && rentMax == null) missingFields.push('rent_min/rent_max')
    if (isDemo && photoCount === 0) missingFields.push('photos')
    
    if (missingFields.length > 0) {
      console.warn('[ListingCard] Missing expected fields:', {
        id,
        isDemo,
        missingFields,
        raw: {
          city: raw.city,
          rent_min: raw.rent_min,
          rent_max: raw.rent_max,
          cover_photo_url: raw.cover_photo_url,
          photo_urls: raw.photo_urls
        }
      })
    }
  }
  
  return {
    id,
    titleCity: city,
    subLocation: area,
    roomType,
    roomTypeRaw,
    isDemo,
    priceText,
    nearText,
    moveInText,
    postedByText,
    companyText,
    coverPhotoUrl,
    photoCount,
    photoUrls,
    rawId: id
  }
}

/**
 * Normalize an array of raw listings
 */
export function normalizeListings(rawListings: RawListing[]): ListingCardModel[] {
  return rawListings.map(normalizeListing)
}
