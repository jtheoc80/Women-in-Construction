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
      '/demo/listings/1.jpg',
      '/demo/listings/2.jpg',
      '/demo/listings/3.jpg',
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
      '/demo/listings/4.jpg',
      '/demo/listings/5.jpg',
      '/demo/listings/111.jpg',
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
      '/demo/listings/6.jpg',
      '/demo/listings/1.jpg',
      '/demo/listings/2.jpg',
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
      '/demo/listings/3.jpg',
      '/demo/listings/4.jpg',
      '/demo/listings/5.jpg',
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
      '/demo/listings/6.jpg',
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
      '/demo/listings/1.jpg',
      '/demo/listings/2.jpg',
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
      '/demo/listings/3.jpg',
      '/demo/listings/4.jpg',
    ],
  },
]

export interface SeedJobsite {
  name: string
  city: string
  state: string
  slug: string
  lat: number
  lng: number
  description: string
  operator?: string
  project_type?: string
}

export const seedJobsites: SeedJobsite[] = [
  // Arizona
  {
    name: 'TSMC Arizona',
    city: 'Phoenix',
    state: 'AZ',
    slug: 'tsmc-arizona',
    lat: 33.6668,
    lng: -112.0060,
    description: 'Taiwan Semiconductor Manufacturing Company fab facility. Multiple phases of construction.',
    operator: 'TSMC',
    project_type: 'Semiconductor Fab',
  },
  {
    name: 'Intel Ocotillo',
    city: 'Chandler',
    state: 'AZ',
    slug: 'intel-ocotillo',
    lat: 33.2369,
    lng: -111.8693,
    description: 'Intel semiconductor manufacturing campus. Ongoing expansion projects.',
    operator: 'Intel',
    project_type: 'Semiconductor Fab',
  },
  // Texas
  {
    name: 'Samsung Taylor',
    city: 'Taylor',
    state: 'TX',
    slug: 'samsung-taylor',
    lat: 30.5708,
    lng: -97.4093,
    description: 'Samsung semiconductor fab. Major construction project.',
    operator: 'Samsung',
    project_type: 'Semiconductor Fab',
  },
  {
    name: 'Texas Instruments Richardson',
    city: 'Richardson',
    state: 'TX',
    slug: 'ti-richardson',
    lat: 32.9485,
    lng: -96.7098,
    description: 'TI semiconductor facility expansion.',
    operator: 'Texas Instruments',
    project_type: 'Semiconductor Fab',
  },
  {
    name: 'Tesla Gigafactory Texas',
    city: 'Austin',
    state: 'TX',
    slug: 'tesla-gigafactory-texas',
    lat: 30.2240,
    lng: -97.6170,
    description: 'Tesla vehicle and battery manufacturing.',
    operator: 'Tesla',
    project_type: 'Manufacturing',
  },
  // Ohio
  {
    name: 'Intel Ohio',
    city: 'New Albany',
    state: 'OH',
    slug: 'intel-ohio',
    lat: 40.0817,
    lng: -82.8084,
    description: 'Intel mega-site semiconductor fab. Largest single private investment in Ohio history.',
    operator: 'Intel',
    project_type: 'Semiconductor Fab',
  },
  // New York
  {
    name: 'Micron Syracuse',
    city: 'Clay',
    state: 'NY',
    slug: 'micron-syracuse',
    lat: 43.1917,
    lng: -76.1857,
    description: 'Micron memory chip fab facility.',
    operator: 'Micron',
    project_type: 'Semiconductor Fab',
  },
  // Idaho
  {
    name: 'Micron Boise',
    city: 'Boise',
    state: 'ID',
    slug: 'micron-boise',
    lat: 43.5949,
    lng: -116.2240,
    description: 'Micron Technology headquarters and fab expansion.',
    operator: 'Micron',
    project_type: 'Semiconductor Fab',
  },
  // Virginia
  {
    name: 'AWS Data Center Ashburn',
    city: 'Ashburn',
    state: 'VA',
    slug: 'aws-ashburn',
    lat: 39.0438,
    lng: -77.4874,
    description: 'Amazon Web Services data center campus.',
    operator: 'AWS',
    project_type: 'Data Center',
  },
  {
    name: 'Microsoft Boydton',
    city: 'Boydton',
    state: 'VA',
    slug: 'microsoft-boydton',
    lat: 36.6675,
    lng: -78.3872,
    description: 'Microsoft Azure data center campus.',
    operator: 'Microsoft',
    project_type: 'Data Center',
  },
]

export interface SeedHub {
  jobsiteSlug: string
  name: string
  commuteMin: number
  commuteMax: number
  description: string
}

export const seedHubs: SeedHub[] = [
  // TSMC Arizona
  { jobsiteSlug: 'tsmc-arizona', name: 'North Phoenix', commuteMin: 10, commuteMax: 20, description: 'Closest to TSMC site. Mix of apartments and newer developments.' },
  { jobsiteSlug: 'tsmc-arizona', name: 'Deer Valley', commuteMin: 15, commuteMax: 25, description: 'Good access via I-17. More suburban feel.' },
  { jobsiteSlug: 'tsmc-arizona', name: 'Glendale', commuteMin: 20, commuteMax: 35, description: 'Affordable options. Use Loop 101 or surface streets.' },
  { jobsiteSlug: 'tsmc-arizona', name: 'Peoria', commuteMin: 25, commuteMax: 40, description: 'More space for the money. Can be traffic-heavy at shift changes.' },
  { jobsiteSlug: 'tsmc-arizona', name: 'Scottsdale', commuteMin: 30, commuteMax: 45, description: 'Upscale area. Longer commute but nice amenities.' },
  { jobsiteSlug: 'tsmc-arizona', name: 'Chandler', commuteMin: 35, commuteMax: 50, description: 'South Valley option. May suit those also considering Intel.' },
  { jobsiteSlug: 'tsmc-arizona', name: 'Mesa', commuteMin: 35, commuteMax: 50, description: 'East Valley. Affordable but longer drive.' },
  // Intel Ocotillo
  { jobsiteSlug: 'intel-ocotillo', name: 'Chandler', commuteMin: 5, commuteMax: 15, description: 'Walk or bike to site. Best for work-life balance.' },
  { jobsiteSlug: 'intel-ocotillo', name: 'Gilbert', commuteMin: 10, commuteMax: 20, description: 'Family-friendly. Good schools and amenities.' },
  { jobsiteSlug: 'intel-ocotillo', name: 'Mesa', commuteMin: 15, commuteMax: 25, description: 'Affordable with good transit options.' },
  { jobsiteSlug: 'intel-ocotillo', name: 'Tempe', commuteMin: 15, commuteMax: 30, description: 'College town vibe. Near ASU with younger crowd.' },
  { jobsiteSlug: 'intel-ocotillo', name: 'Queen Creek', commuteMin: 20, commuteMax: 35, description: 'Newer developments. More rural feel.' },
  { jobsiteSlug: 'intel-ocotillo', name: 'Phoenix - Ahwatukee', commuteMin: 20, commuteMax: 35, description: 'Mountain views. Use I-10 or surface streets.' },
  { jobsiteSlug: 'intel-ocotillo', name: 'Scottsdale', commuteMin: 25, commuteMax: 40, description: 'Upscale. Traffic can be heavy on 101.' },
  // Samsung Taylor
  { jobsiteSlug: 'samsung-taylor', name: 'Taylor', commuteMin: 0, commuteMax: 15, description: 'Right in town. Limited inventory but shortest commute.' },
  { jobsiteSlug: 'samsung-taylor', name: 'Hutto', commuteMin: 15, commuteMax: 25, description: 'Growing suburb. Good new construction options.' },
  { jobsiteSlug: 'samsung-taylor', name: 'Round Rock', commuteMin: 20, commuteMax: 35, description: 'Lots of amenities and dining. Use 79 or toll roads.' },
  { jobsiteSlug: 'samsung-taylor', name: 'Pflugerville', commuteMin: 20, commuteMax: 35, description: 'Affordable suburb. Similar commute to Round Rock.' },
  { jobsiteSlug: 'samsung-taylor', name: 'Georgetown', commuteMin: 30, commuteMax: 45, description: 'Historic downtown. Charming but further out.' },
  { jobsiteSlug: 'samsung-taylor', name: 'Austin - East', commuteMin: 35, commuteMax: 50, description: 'City living. Use 130 toll or 290.' },
  { jobsiteSlug: 'samsung-taylor', name: 'Elgin', commuteMin: 15, commuteMax: 25, description: 'Small town east of Taylor. Very affordable.' },
  // Intel Ohio
  { jobsiteSlug: 'intel-ohio', name: 'New Albany', commuteMin: 5, commuteMax: 15, description: 'Upscale planned community. Closest to site.' },
  { jobsiteSlug: 'intel-ohio', name: 'Johnstown', commuteMin: 10, commuteMax: 20, description: 'Small town with growing options.' },
  { jobsiteSlug: 'intel-ohio', name: 'Westerville', commuteMin: 15, commuteMax: 30, description: 'Established suburb. Good schools.' },
  { jobsiteSlug: 'intel-ohio', name: 'Gahanna', commuteMin: 15, commuteMax: 25, description: 'Near airport. Convenient location.' },
  { jobsiteSlug: 'intel-ohio', name: 'Columbus - Easton', commuteMin: 20, commuteMax: 35, description: 'Urban living with shopping and dining.' },
  { jobsiteSlug: 'intel-ohio', name: 'Columbus - Short North', commuteMin: 25, commuteMax: 40, description: 'Arts district. Vibrant nightlife.' },
  { jobsiteSlug: 'intel-ohio', name: 'Delaware', commuteMin: 25, commuteMax: 40, description: 'College town. Affordable student-area housing.' },
  { jobsiteSlug: 'intel-ohio', name: 'Newark', commuteMin: 30, commuteMax: 45, description: 'Further east. Very affordable options.' },
  // Micron Syracuse
  { jobsiteSlug: 'micron-syracuse', name: 'Clay', commuteMin: 5, commuteMax: 15, description: 'Closest to site. Suburban neighborhood.' },
  { jobsiteSlug: 'micron-syracuse', name: 'Liverpool', commuteMin: 10, commuteMax: 20, description: 'Near Onondaga Lake. Good amenities.' },
  { jobsiteSlug: 'micron-syracuse', name: 'Cicero', commuteMin: 10, commuteMax: 20, description: 'North suburb. Mix of old and new housing.' },
  { jobsiteSlug: 'micron-syracuse', name: 'Syracuse - North Side', commuteMin: 15, commuteMax: 25, description: 'Urban option. Near downtown.' },
  { jobsiteSlug: 'micron-syracuse', name: 'Baldwinsville', commuteMin: 20, commuteMax: 30, description: 'Small town charm. Good schools.' },
  { jobsiteSlug: 'micron-syracuse', name: 'East Syracuse', commuteMin: 20, commuteMax: 30, description: 'Near airport and I-90.' },
  { jobsiteSlug: 'micron-syracuse', name: 'Fayetteville', commuteMin: 25, commuteMax: 40, description: 'Upscale suburb. Longer commute.' },
  // Micron Boise
  { jobsiteSlug: 'micron-boise', name: 'Boise - Downtown', commuteMin: 5, commuteMax: 15, description: 'Urban living. Walk or bike possible.' },
  { jobsiteSlug: 'micron-boise', name: 'Boise - Bench', commuteMin: 10, commuteMax: 20, description: 'South Boise. Good neighborhood feel.' },
  { jobsiteSlug: 'micron-boise', name: 'Garden City', commuteMin: 10, commuteMax: 20, description: 'Eclectic area. Good value.' },
  { jobsiteSlug: 'micron-boise', name: 'Meridian', commuteMin: 15, commuteMax: 30, description: 'Fastest growing city in Idaho. Lots of new construction.' },
  { jobsiteSlug: 'micron-boise', name: 'Eagle', commuteMin: 20, commuteMax: 35, description: 'Upscale suburb. Nice outdoor access.' },
  { jobsiteSlug: 'micron-boise', name: 'Nampa', commuteMin: 25, commuteMax: 40, description: 'Most affordable option. Growing area.' },
  { jobsiteSlug: 'micron-boise', name: 'Caldwell', commuteMin: 30, commuteMax: 45, description: 'Further west. Very affordable.' },
  // AWS Ashburn
  { jobsiteSlug: 'aws-ashburn', name: 'Ashburn', commuteMin: 5, commuteMax: 15, description: 'In Data Center Alley. Lots of options.' },
  { jobsiteSlug: 'aws-ashburn', name: 'Sterling', commuteMin: 10, commuteMax: 20, description: 'Adjacent to Ashburn. Good mix of housing.' },
  { jobsiteSlug: 'aws-ashburn', name: 'Leesburg', commuteMin: 15, commuteMax: 25, description: 'Historic downtown. Charming area.' },
  { jobsiteSlug: 'aws-ashburn', name: 'Herndon', commuteMin: 10, commuteMax: 25, description: 'Near Dulles. Good transit options.' },
  { jobsiteSlug: 'aws-ashburn', name: 'Reston', commuteMin: 15, commuteMax: 30, description: 'Planned community. Metro access.' },
  { jobsiteSlug: 'aws-ashburn', name: 'South Riding', commuteMin: 15, commuteMax: 30, description: 'Newer development. Family-friendly.' },
  { jobsiteSlug: 'aws-ashburn', name: 'Chantilly', commuteMin: 15, commuteMax: 30, description: 'Near airport. Good highway access.' },
  // Tesla Texas
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Del Valle', commuteMin: 5, commuteMax: 15, description: 'Closest to Giga Texas. Growing fast.' },
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Austin - Southeast', commuteMin: 10, commuteMax: 25, description: 'Urban options near 183.' },
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Austin - East', commuteMin: 15, commuteMax: 30, description: 'Trendy East Austin. Good food scene.' },
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Bastrop', commuteMin: 20, commuteMax: 35, description: 'Small town. Very affordable.' },
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Manor', commuteMin: 15, commuteMax: 30, description: 'Growing suburb. Good value.' },
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Pflugerville', commuteMin: 25, commuteMax: 40, description: 'Established suburb. More amenities.' },
  { jobsiteSlug: 'tesla-gigafactory-texas', name: 'Kyle', commuteMin: 25, commuteMax: 40, description: 'South of Austin. Use 130 toll.' },
]
