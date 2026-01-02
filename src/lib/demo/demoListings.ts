/**
 * Demo Listings - Single source of truth for demo data
 * 
 * IMPORTANT: These listings use stable, URL-safe string IDs that work
 * consistently across page refreshes and for anonymous users.
 * 
 * Each demo listing has all the fields needed for both card display
 * and detail page rendering.
 */

export interface DemoListing {
  id: string                    // Stable, URL-safe ID (e.g., "demo-ashburn-private-1")
  isDemo: true                  // Always true for demo listings
  roomType: 'Private Room' | 'Shared Room' | 'Entire Place'
  roomTypeRaw: 'private_room' | 'shared_room' | 'entire_place'
  city: string
  countyOrArea: string
  state: string
  priceMin: number
  priceMax: number
  nearLabel: string
  moveInDate: string            // ISO string
  postedByName: string
  companyName: string
  description: string           // 3-6 sentences
  photoUrls: string[]           // Local /public paths
  amenities: string[]
  rules: string[]
  // Additional detail fields
  title: string
  shift?: 'day' | 'swing' | 'night'
}

// Configuration flag for demo mode
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'

/**
 * Demo listings array - 6 realistic listings with stable IDs
 */
export const demoListings: DemoListing[] = [
  {
    id: 'demo-ashburn-private-1',
    isDemo: true,
    title: 'Sunny Room near Data Center',
    roomType: 'Private Room',
    roomTypeRaw: 'private_room',
    city: 'Ashburn',
    countyOrArea: 'Loudoun County',
    state: 'VA',
    priceMin: 800,
    priceMax: 950,
    nearLabel: 'Data Center Alley',
    moveInDate: '2026-01-15',
    postedByName: 'Sarah M.',
    companyName: 'Turner Construction',
    description: `Spacious private room in a quiet townhouse, perfect for women working at the data centers in Loudoun County. The house is in a safe neighborhood with easy access to Route 7 and the Dulles Greenway.

You'll have your own bedroom with a lock, plus shared access to a fully-equipped kitchen, living room, and one bathroom. Laundry is in-unit. I work day shift at the AWS campus, so evenings are quiet.

Looking for a clean, respectful roommate who values their space. No smoking, no parties. Month-to-month available after initial 3-month commitment.`,
    photoUrls: [
      '/demo/listings/1.jpg',
      '/demo/listings/2.jpg',
      '/demo/listings/3.jpg',
    ],
    amenities: ['WiFi Included', 'In-Unit Laundry', 'Parking', 'Air Conditioning', 'Furnished'],
    rules: ['No Smoking', 'No Pets', 'Quiet Hours 10PM-7AM'],
    shift: 'day',
  },
  {
    id: 'demo-phoenix-shared-1',
    isDemo: true,
    title: 'Shared Room - Weekly Rates Available',
    roomType: 'Shared Room',
    roomTypeRaw: 'shared_room',
    city: 'Phoenix',
    countyOrArea: 'Chandler',
    state: 'AZ',
    priceMin: 400,
    priceMax: 500,
    nearLabel: 'Intel Ocotillo',
    moveInDate: '2026-01-10',
    postedByName: 'Maria R.',
    companyName: 'DPR Construction',
    description: `Affordable shared room in a 3-bedroom house near the Intel Ocotillo campus. You'll share the room with one other female construction worker who's also on the Intel project.

The house has central A/C (essential in Phoenix!), a big backyard with a covered patio, and off-street parking. Kitchen is fully stocked, and we have a weekly cleaning service included in the rent.

We're both on swing shift, so the place is quiet during the day. Perfect for someone new to the Phoenix area who wants an easy, affordable setup.`,
    photoUrls: [
      '/demo/listings/2.jpg',
      '/demo/listings/4.jpg',
    ],
    amenities: ['Central A/C', 'Weekly Cleaning', 'Covered Parking', 'Backyard', 'Short-Term OK'],
    rules: ['Female Only', 'No Smoking Inside', 'Pets Negotiable'],
    shift: 'swing',
  },
  {
    id: 'demo-columbus-private-1',
    isDemo: true,
    title: 'Private Room in New Albany Townhouse',
    roomType: 'Private Room',
    roomTypeRaw: 'private_room',
    city: 'Columbus',
    countyOrArea: 'New Albany',
    state: 'OH',
    priceMin: 900,
    priceMax: 1100,
    nearLabel: 'Intel Ohio',
    moveInDate: '2026-01-20',
    postedByName: 'Jessica T.',
    companyName: 'Bechtel',
    description: `Beautiful private room in a brand new townhouse, just 10 minutes from the Intel Ohio construction site. The community has a pool, fitness center, and walking trails.

Your room is on the second floor with plenty of natural light and a walk-in closet. You'll share a bathroom with one other person (me!). The kitchen is modern with stainless appliances, and there's a two-car garage with space for your vehicle.

I'm an electrician on the Intel project working nights, so the place is quiet during the day. Ideal for someone on day shift. 6-month lease minimum.`,
    photoUrls: [
      '/demo/listings/3.jpg',
      '/demo/listings/5.jpg',
      '/demo/listings/6.jpg',
    ],
    amenities: ['Pool Access', 'Gym', 'Garage Parking', 'Walk-in Closet', 'Modern Kitchen'],
    rules: ['No Smoking', 'No Pets', 'Quiet Hours Respected'],
    shift: 'night',
  },
  {
    id: 'demo-prineville-private-1',
    isDemo: true,
    title: 'Quiet Room in Crook County',
    roomType: 'Private Room',
    roomTypeRaw: 'private_room',
    city: 'Prineville',
    countyOrArea: 'Crook County',
    state: 'OR',
    priceMin: 700,
    priceMax: 750,
    nearLabel: 'Meta Data Center',
    moveInDate: '2026-01-05',
    postedByName: 'Ashley K.',
    companyName: 'Rosendin Electric',
    description: `Private room in a peaceful house just outside Prineville. Perfect location for anyone working at the Meta or Apple data centers. The commute is about 15 minutes to either site.

This is a single-family home with a large yard and mountain views. You get your own bedroom and share the bathroom, kitchen, and living areas. I work at the Meta site as well, so I totally understand the work schedule demands.

The area is super quiet - great for actually getting rest between shifts. There's a fire pit in the backyard and space to park your truck.`,
    photoUrls: [
      '/demo/listings/4.jpg',
      '/demo/listings/1.jpg',
    ],
    amenities: ['Mountain Views', 'Large Yard', 'Fire Pit', 'Truck Parking', 'Quiet Neighborhood'],
    rules: ['No Smoking', 'No Parties', 'Respectful of Quiet Hours'],
    shift: 'day',
  },
  {
    id: 'demo-sanantonio-private-1',
    isDemo: true,
    title: 'Master Bedroom with Private Bath',
    roomType: 'Private Room',
    roomTypeRaw: 'private_room',
    city: 'San Antonio',
    countyOrArea: 'Westover Hills',
    state: 'TX',
    priceMin: 1000,
    priceMax: 1100,
    nearLabel: 'Microsoft Data Center',
    moveInDate: '2026-01-25',
    postedByName: 'Elena G.',
    companyName: 'Holder Construction',
    description: `Luxury master bedroom with en-suite bathroom in a gated community. This is a premium setup for someone who values their privacy and comfort after long days on site.

The room features a king bed (optional), walk-in closet, and your own full bathroom with double vanity. The apartment complex has a resort-style pool, 24-hour fitness center, and covered parking.

I'm a field engineer at the Microsoft project. Looking for a professional female roommate who keeps common areas clean. Utilities and WiFi included in rent.`,
    photoUrls: [
      '/demo/listings/5.jpg',
      '/demo/listings/6.jpg',
      '/demo/listings/2.jpg',
    ],
    amenities: ['Private Bathroom', 'Pool', '24hr Gym', 'Gated Community', 'Utilities Included'],
    rules: ['No Smoking', 'No Pets', 'Professional Environment'],
    shift: 'day',
  },
  {
    id: 'demo-huntsville-shared-1',
    isDemo: true,
    title: 'Cozy Room - Female Tradeswomen Welcome',
    roomType: 'Shared Room',
    roomTypeRaw: 'shared_room',
    city: 'Huntsville',
    countyOrArea: 'Madison',
    state: 'AL',
    priceMin: 550,
    priceMax: 600,
    nearLabel: 'Meta Huntsville',
    moveInDate: '2026-01-08',
    postedByName: 'Lisa M.',
    companyName: 'Meta Contractors',
    description: `Budget-friendly shared room in a 4-bedroom house with three other women in the trades. We've created a supportive environment where everyone understands the demands of construction work.

The house is a 20-minute drive to the Meta Huntsville site. You'll share a room with one other person and have access to two shared bathrooms. The kitchen is always stocked with basics, and we do a monthly house dinner together.

We're looking for someone who's clean, respectful, and ready to be part of a mini community. Great option if you're new to the area or on a short-term project.`,
    photoUrls: [
      '/demo/listings/6.jpg',
      '/demo/listings/3.jpg',
    ],
    amenities: ['Washer/Dryer', 'Stocked Kitchen', 'Community Dinners', 'Female Only House', 'Flexible Lease'],
    rules: ['Female Only', 'No Smoking', 'Clean Up After Yourself', 'Quiet After 10PM'],
  },
]

/**
 * Find a demo listing by its ID
 */
export function getDemoListingById(id: string): DemoListing | undefined {
  return demoListings.find(listing => listing.id === id)
}

/**
 * Check if an ID belongs to a demo listing
 */
export function isDemoListingId(id: string): boolean {
  return id.startsWith('demo-') && demoListings.some(l => l.id === id)
}

/**
 * Get all demo listing IDs
 */
export function getDemoListingIds(): string[] {
  return demoListings.map(l => l.id)
}
