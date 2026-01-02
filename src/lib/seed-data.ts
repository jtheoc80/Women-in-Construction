/**
 * Seed data for the front page listings
 * This data populates the home page with demo listings so it doesn't look empty
 */

export interface SeedProfile {
  email: string
  firstName: string
  homeCity: string
  company: string
  role: string
  bio: string
}

export interface SeedListing {
  profileIndex: number // Index into seedProfiles array
  city: string
  area: string
  rentMin: number
  rentMax: number
  moveInDays: number // Days from now
  roomType: 'private_room' | 'shared_room' | 'entire_place'
  commuteArea: string
  details: string
  photoUrls: string[] // Placeholder image URLs
}

// Demo profiles for seed users
export const seedProfiles: SeedProfile[] = [
  {
    email: 'sarah.demo@sitesisters.local',
    firstName: 'Sarah',
    homeCity: 'Phoenix, AZ',
    company: 'TSMC Arizona',
    role: 'Electrician',
    bio: 'Electrician working at TSMC. Early shifts preferred. Looking for a quiet, clean roommate.',
  },
  {
    email: 'jessica.demo@sitesisters.local',
    firstName: 'Jessica',
    homeCity: 'Taylor, TX',
    company: 'Samsung Taylor',
    role: 'Welder',
    bio: 'Welder on the Samsung project. Been in the trades for 8 years.',
  },
  {
    email: 'amanda.demo@sitesisters.local',
    firstName: 'Amanda',
    homeCity: 'Columbus, OH',
    company: 'Intel Ohio',
    role: 'HVAC Technician',
    bio: 'HVAC tech at Intel Ohio. 6-month project assignment.',
  },
  {
    email: 'michelle.demo@sitesisters.local',
    firstName: 'Michelle',
    homeCity: 'Chandler, AZ',
    company: 'Intel Ocotillo',
    role: 'Project Coordinator',
    bio: 'Project coordinator at Intel. Organized and easy to live with.',
  },
  {
    email: 'rachel.demo@sitesisters.local',
    firstName: 'Rachel',
    homeCity: 'Round Rock, TX',
    company: 'Samsung Taylor',
    role: 'Pipefitter',
    bio: 'Pipefitter at Samsung Taylor. Day shift schedule.',
  },
  {
    email: 'lauren.demo@sitesisters.local',
    firstName: 'Lauren',
    homeCity: 'Boise, ID',
    company: 'Micron Boise',
    role: 'QA Technician',
    bio: 'QA tech at Micron. Love hiking on weekends.',
  },
]

// Demo listings with realistic data
export const seedListings: SeedListing[] = [
  {
    profileIndex: 0,
    city: 'Phoenix, AZ',
    area: 'North Phoenix',
    rentMin: 850,
    rentMax: 1000,
    moveInDays: 30,
    roomType: 'private_room',
    commuteArea: 'TSMC Arizona',
    details: 'Clean, quiet 2BR apartment. Looking for a roommate who works similar shifts. I have the day shift at TSMC. Place has a pool and gym. Non-smoker preferred. Utilities included in rent.',
    photoUrls: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ],
  },
  {
    profileIndex: 1,
    city: 'Taylor, TX',
    area: 'Hutto',
    rentMin: 700,
    rentMax: 850,
    moveInDays: 14,
    roomType: 'shared_room',
    commuteArea: 'Samsung Taylor',
    details: 'Sharing a 3BR house with one other tradeswoman. Room available is shared. We\'re both on swing shift at Samsung. House has a big backyard and washer/dryer. Pet-friendly!',
    photoUrls: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
    ],
  },
  {
    profileIndex: 2,
    city: 'New Albany, OH',
    area: 'New Albany',
    rentMin: 900,
    rentMax: 1100,
    moveInDays: 7,
    roomType: 'private_room',
    commuteArea: 'Intel Ohio',
    details: 'Private room in a new townhouse. 10 min from the Intel site. I work nights so the place is quiet during the day. 6-month lease available. Furnished room included.',
    photoUrls: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    ],
  },
  {
    profileIndex: 3,
    city: 'Chandler, AZ',
    area: 'Chandler',
    rentMin: 1100,
    rentMax: 1300,
    moveInDays: 45,
    roomType: 'entire_place',
    commuteArea: 'Intel Ocotillo',
    details: 'Entire 1BR apartment available. I\'m relocating for a new project. Lease takeover with option to renew. Great complex with pool, gym, and covered parking. Close to shopping.',
    photoUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80',
    ],
  },
  {
    profileIndex: 4,
    city: 'Round Rock, TX',
    area: 'Round Rock',
    rentMin: 750,
    rentMax: 900,
    moveInDays: 21,
    roomType: 'private_room',
    commuteArea: 'Samsung Taylor',
    details: 'Looking for a roommate for my 2BR apartment. I work day shift as a pipefitter. Place is furnished, just need to bring your stuff for your room. Great location near 79.',
    photoUrls: [],
  },
  {
    profileIndex: 5,
    city: 'Boise, ID',
    area: 'Meridian',
    rentMin: 650,
    rentMax: 800,
    moveInDays: 10,
    roomType: 'shared_room',
    commuteArea: 'Micron Boise',
    details: 'Shared room in a 4BR house with 3 other women. We all work at Micron on different shifts. House is laid back and clean. Big kitchen, backyard with fire pit.',
    photoUrls: [
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
    ],
  },
  {
    profileIndex: 0,
    city: 'Phoenix, AZ',
    area: 'Glendale',
    rentMin: 600,
    rentMax: 750,
    moveInDays: 5,
    roomType: 'shared_room',
    commuteArea: 'TSMC Arizona',
    details: 'Affordable shared room near Loop 101. Easy commute to TSMC. House has 4 bedrooms, 2 bathrooms. Looking for someone clean and respectful. Month-to-month available.',
    photoUrls: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    ],
  },
  {
    profileIndex: 2,
    city: 'Columbus, OH',
    area: 'Westerville',
    rentMin: 800,
    rentMax: 950,
    moveInDays: 14,
    roomType: 'private_room',
    commuteArea: 'Intel Ohio',
    details: 'Private room in a nice suburban home. Good schools area. 20 min to Intel Ohio site. Full access to kitchen, living room, and laundry. Looking for a responsible roommate.',
    photoUrls: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80',
    ],
  },
]
