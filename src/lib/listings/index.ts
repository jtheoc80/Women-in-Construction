/**
 * Listings module - centralized exports for listing data handling
 */

export {
  normalizeListing,
  normalizeListings,
  normalizePhotoUrl,
  normalizeDemoListing,
  getNormalizedDemoListings,
  normalizeListingsWithDemo,
  type ListingCardModel,
  type RawListing,
} from './normalize'

// Re-export demo utilities
export {
  demoListings,
  getDemoListingById,
  isDemoListingId,
  getDemoListingIds,
  DEMO_MODE,
  type DemoListing,
} from './normalize'
