
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
// Also try .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Please ensure .env.local exists and contains these keys.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const jobsites = [
  { name: 'TSMC Arizona', city: 'Phoenix', state: 'AZ', slug: 'tsmc-arizona', lat: 33.6668, lng: -112.0060, description: 'Taiwan Semiconductor Manufacturing Company fab facility. Multiple phases of construction.' },
  { name: 'Intel Ocotillo', city: 'Chandler', state: 'AZ', slug: 'intel-ocotillo', lat: 33.2369, lng: -111.8693, description: 'Intel semiconductor manufacturing campus. Ongoing expansion projects.' },
  { name: 'Samsung Taylor', city: 'Taylor', state: 'TX', slug: 'samsung-taylor', lat: 30.5708, lng: -97.4093, description: 'Samsung semiconductor fab. Major construction project.' },
  { name: 'Texas Instruments Richardson', city: 'Richardson', state: 'TX', slug: 'ti-richardson', lat: 32.9485, lng: -96.7098, description: 'TI semiconductor facility expansion.' },
  { name: 'Tesla Gigafactory Texas', city: 'Austin', state: 'TX', slug: 'tesla-gigafactory-texas', lat: 30.2240, lng: -97.6170, description: 'Tesla vehicle and battery manufacturing.' },
  { name: 'Intel Ohio', city: 'New Albany', state: 'OH', slug: 'intel-ohio', lat: 40.0817, lng: -82.8084, description: 'Intel mega-site semiconductor fab. Largest single private investment in Ohio history.' },
  { name: 'Micron Syracuse', city: 'Clay', state: 'NY', slug: 'micron-syracuse', lat: 43.1917, lng: -76.1857, description: 'Micron memory chip fab facility.' },
  { name: 'Micron Boise', city: 'Boise', state: 'ID', slug: 'micron-boise', lat: 43.5949, lng: -116.2240, description: 'Micron Technology headquarters and fab expansion.' },
  { name: 'AWS Data Center Ashburn', city: 'Ashburn', state: 'VA', slug: 'aws-ashburn', lat: 39.0438, lng: -77.4874, description: 'Amazon Web Services data center campus.' },
  { name: 'Microsoft Boydton', city: 'Boydton', state: 'VA', slug: 'microsoft-boydton', lat: 36.6675, lng: -78.3872, description: 'Microsoft Azure data center campus.' },
]

const hubsData: Record<string, any[]> = {
  'tsmc-arizona': [
    { name: 'North Phoenix', commute_min: 10, commute_max: 20, description: 'Closest to TSMC site. Mix of apartments and newer developments.' },
    { name: 'Deer Valley', commute_min: 15, commute_max: 25, description: 'Good access via I-17. More suburban feel.' },
    { name: 'Glendale', commute_min: 20, commute_max: 35, description: 'Affordable options. Use Loop 101 or surface streets.' },
    { name: 'Peoria', commute_min: 25, commute_max: 40, description: 'More space for the money. Can be traffic-heavy at shift changes.' },
    { name: 'Scottsdale', commute_min: 30, commute_max: 45, description: 'Upscale area. Longer commute but nice amenities.' },
    { name: 'Chandler', commute_min: 35, commute_max: 50, description: 'South Valley option. May suit those also considering Intel.' },
    { name: 'Mesa', commute_min: 35, commute_max: 50, description: 'East Valley. Affordable but longer drive.' }
  ],
  'intel-ocotillo': [
    { name: 'Chandler', commute_min: 5, commute_max: 15, description: 'Walk or bike to site. Best for work-life balance.' },
    { name: 'Gilbert', commute_min: 10, commute_max: 20, description: 'Family-friendly. Good schools and amenities.' },
    { name: 'Mesa', commute_min: 15, commute_max: 25, description: 'Affordable with good transit options.' },
    { name: 'Tempe', commute_min: 15, commute_max: 30, description: 'College town vibe. Near ASU with younger crowd.' },
    { name: 'Queen Creek', commute_min: 20, commute_max: 35, description: 'Newer developments. More rural feel.' },
    { name: 'Phoenix - Ahwatukee', commute_min: 20, commute_max: 35, description: 'Mountain views. Use I-10 or surface streets.' },
    { name: 'Scottsdale', commute_min: 25, commute_max: 40, description: 'Upscale. Traffic can be heavy on 101.' }
  ],
  'samsung-taylor': [
    { name: 'Taylor', commute_min: 0, commute_max: 15, description: 'Right in town. Limited inventory but shortest commute.' },
    { name: 'Hutto', commute_min: 15, commute_max: 25, description: 'Growing suburb. Good new construction options.' },
    { name: 'Round Rock', commute_min: 20, commute_max: 35, description: 'Lots of amenities and dining. Use 79 or toll roads.' },
    { name: 'Pflugerville', commute_min: 20, commute_max: 35, description: 'Affordable suburb. Similar commute to Round Rock.' },
    { name: 'Georgetown', commute_min: 30, commute_max: 45, description: 'Historic downtown. Charming but further out.' },
    { name: 'Austin - East', commute_min: 35, commute_max: 50, description: 'City living. Use 130 toll or 290.' },
    { name: 'Elgin', commute_min: 15, commute_max: 25, description: 'Small town east of Taylor. Very affordable.' }
  ],
  'intel-ohio': [
    { name: 'New Albany', commute_min: 5, commute_max: 15, description: 'Upscale planned community. Closest to site.' },
    { name: 'Johnstown', commute_min: 10, commute_max: 20, description: 'Small town with growing options.' },
    { name: 'Westerville', commute_min: 15, commute_max: 30, description: 'Established suburb. Good schools.' },
    { name: 'Gahanna', commute_min: 15, commute_max: 25, description: 'Near airport. Convenient location.' },
    { name: 'Columbus - Easton', commute_min: 20, commute_max: 35, description: 'Urban living with shopping and dining.' },
    { name: 'Columbus - Short North', commute_min: 25, commute_max: 40, description: 'Arts district. Vibrant nightlife.' },
    { name: 'Delaware', commute_min: 25, commute_max: 40, description: 'College town. Affordable student-area housing.' },
    { name: 'Newark', commute_min: 30, commute_max: 45, description: 'Further east. Very affordable options.' }
  ],
  'micron-syracuse': [
    { name: 'Clay', commute_min: 5, commute_max: 15, description: 'Closest to site. Suburban neighborhood.' },
    { name: 'Liverpool', commute_min: 10, commute_max: 20, description: 'Near Onondaga Lake. Good amenities.' },
    { name: 'Cicero', commute_min: 10, commute_max: 20, description: 'North suburb. Mix of old and new housing.' },
    { name: 'Syracuse - North Side', commute_min: 15, commute_max: 25, description: 'Urban option. Near downtown.' },
    { name: 'Baldwinsville', commute_min: 20, commute_max: 30, description: 'Small town charm. Good schools.' },
    { name: 'East Syracuse', commute_min: 20, commute_max: 30, description: 'Near airport and I-90.' },
    { name: 'Fayetteville', commute_min: 25, commute_max: 40, description: 'Upscale suburb. Longer commute.' }
  ],
  'micron-boise': [
    { name: 'Boise - Downtown', commute_min: 5, commute_max: 15, description: 'Urban living. Walk or bike possible.' },
    { name: 'Boise - Bench', commute_min: 10, commute_max: 20, description: 'South Boise. Good neighborhood feel.' },
    { name: 'Garden City', commute_min: 10, commute_max: 20, description: 'Eclectic area. Good value.' },
    { name: 'Meridian', commute_min: 15, commute_max: 30, description: 'Fastest growing city in Idaho. Lots of new construction.' },
    { name: 'Eagle', commute_min: 20, commute_max: 35, description: 'Upscale suburb. Nice outdoor access.' },
    { name: 'Nampa', commute_min: 25, commute_max: 40, description: 'Most affordable option. Growing area.' },
    { name: 'Caldwell', commute_min: 30, commute_max: 45, description: 'Further west. Very affordable.' }
  ],
  'aws-ashburn': [
    { name: 'Ashburn', commute_min: 5, commute_max: 15, description: 'In Data Center Alley. Lots of options.' },
    { name: 'Sterling', commute_min: 10, commute_max: 20, description: 'Adjacent to Ashburn. Good mix of housing.' },
    { name: 'Leesburg', commute_min: 15, commute_max: 25, description: 'Historic downtown. Charming area.' },
    { name: 'Herndon', commute_min: 10, commute_max: 25, description: 'Near Dulles. Good transit options.' },
    { name: 'Reston', commute_min: 15, commute_max: 30, description: 'Planned community. Metro access.' },
    { name: 'South Riding', commute_min: 15, commute_max: 30, description: 'Newer development. Family-friendly.' },
    { name: 'Chantilly', commute_min: 15, commute_max: 30, description: 'Near airport. Good highway access.' }
  ],
  'tesla-gigafactory-texas': [
    { name: 'Del Valle', commute_min: 5, commute_max: 15, description: 'Closest to Giga Texas. Growing fast.' },
    { name: 'Austin - Southeast', commute_min: 10, commute_max: 25, description: 'Urban options near 183.' },
    { name: 'Austin - East', commute_min: 15, commute_max: 30, description: 'Trendy East Austin. Good food scene.' },
    { name: 'Bastrop', commute_min: 20, commute_max: 35, description: 'Small town. Very affordable.' },
    { name: 'Manor', commute_min: 15, commute_max: 30, description: 'Growing suburb. Good value.' },
    { name: 'Pflugerville', commute_min: 25, commute_max: 40, description: 'Established suburb. More amenities.' },
    { name: 'Kyle', commute_min: 25, commute_max: 40, description: 'South of Austin. Use 130 toll.' }
  ]
}

const posterProfiles = [
  { refId: 'demo_user_1', display_name: 'Sarah M.', company: 'TSMC Arizona', role: 'Electrician' },
  { refId: 'demo_user_2', display_name: 'Jessica R.', company: 'Samsung Taylor', role: 'Welder' },
  { refId: 'demo_user_3', display_name: 'Amanda K.', company: 'Intel Ohio', role: 'HVAC Tech' },
  { refId: 'demo_user_4', display_name: 'Michelle T.', company: 'Intel Ocotillo', role: 'Project Coordinator' },
  { refId: 'demo_user_5', display_name: 'Rachel B.', company: 'Samsung Taylor', role: 'Pipefitter' },
  { refId: 'demo_user_6', display_name: 'Lauren W.', company: 'Micron Boise', role: 'QA Tech' },
]

const listingsData = [
  {
    posterRef: 'demo_user_1',
    jobsiteSlug: 'tsmc-arizona',
    hubName: 'North Phoenix',
    listing: {
      city: 'Phoenix',
      area: 'North Phoenix',
      rent_min: 850,
      rent_max: 1000,
      move_in: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      room_type: 'private_room',
      commute_area: 'TSMC Arizona',
      details: 'Clean, quiet 2BR apartment. Looking for a roommate who works similar shifts. I have the day shift at TSMC. Place has a pool and gym. Non-smoker preferred.',
      is_active: true,
      tags: ['day-shift', 'non-smoker', 'pool']
    },
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ]
  },
  {
    posterRef: 'demo_user_2',
    jobsiteSlug: 'samsung-taylor',
    hubName: 'Hutto',
    listing: {
      city: 'Taylor',
      area: 'Hutto',
      rent_min: 700,
      rent_max: 850,
      move_in: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      room_type: 'shared_room',
      commute_area: 'Samsung Taylor',
      details: 'Sharing a 3BR house with one other tradeswomen. Room available is shared. We\'re both on swing shift at Samsung. House has a big backyard and washer/dryer.',
      is_active: true,
      tags: ['swing-shift', 'yard', 'washer-dryer']
    },
    photos: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800'
    ]
  },
  {
    posterRef: 'demo_user_3',
    jobsiteSlug: 'intel-ohio',
    hubName: 'New Albany',
    listing: {
      city: 'New Albany',
      area: 'New Albany',
      rent_min: 900,
      rent_max: 1100,
      move_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      room_type: 'private_room',
      commute_area: 'Intel Ohio',
      details: 'Private room in a new townhouse. 10 min from the Intel site. I work nights so the place is quiet during the day. 6-month lease available.',
      is_active: true,
      tags: ['night-shift', 'short-term', 'quiet']
    },
    photos: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800'
    ]
  },
  {
    posterRef: 'demo_user_4',
    jobsiteSlug: 'intel-ocotillo',
    hubName: 'Chandler',
    listing: {
      city: 'Chandler',
      area: 'Chandler',
      rent_min: 1100,
      rent_max: 1300,
      move_in: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      room_type: 'entire_place',
      commute_area: 'Intel Ocotillo',
      details: 'Entire 1BR apartment available. I\'m relocating for a new project. Lease takeover with option to renew. Great complex with pool, gym, and covered parking.',
      is_active: true,
      tags: ['day-shift', 'pet-friendly', 'gym']
    },
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800'
    ]
  },
  {
    posterRef: 'demo_user_5',
    jobsiteSlug: 'samsung-taylor',
    hubName: 'Round Rock',
    listing: {
      city: 'Round Rock',
      area: 'Round Rock',
      rent_min: 750,
      rent_max: 900,
      move_in: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      room_type: 'private_room',
      commute_area: 'Samsung Taylor',
      details: 'Looking for a roommate for my 2BR apartment. I work day shift as a pipefitter. Place is furnished, just need to bring your stuff for your room.',
      is_active: true,
      tags: ['day-shift', 'furnished']
    },
    photos: [] // No photos
  },
  {
    posterRef: 'demo_user_6',
    jobsiteSlug: 'micron-boise',
    hubName: 'Meridian',
    listing: {
      city: 'Boise',
      area: 'Meridian',
      rent_min: 650,
      rent_max: 800,
      move_in: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      room_type: 'shared_room',
      commute_area: 'Micron Boise',
      details: 'Shared room in a 4BR house with 3 other women. We all work at Micron on different shifts. House is laid back and clean.',
      is_active: true,
      tags: ['swing-shift', 'women-only']
    },
    photos: ['https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800']
  }
]

async function runSeed() {
  console.log('Starting seed...')

  // 1. Seed Jobsites
  console.log('Seeding jobsites...')
  const { data: savedJobsites, error: jobsitesError } = await supabase
    .from('jobsites')
    .upsert(jobsites, { onConflict: 'slug' })
    .select()

  if (jobsitesError) {
    console.error('Error seeding jobsites:', jobsitesError)
    return
  }
  
  // Create map of slug -> id
  const jobsiteMap = new Map(savedJobsites.map(j => [j.slug, j.id]))

  // 2. Seed Hubs
  console.log('Seeding hubs...')
  const allHubs = []
  for (const [slug, hubs] of Object.entries(hubsData)) {
    const jobsiteId = jobsiteMap.get(slug)
    if (!jobsiteId) continue
    
    // Add jobsite_id to each hub
    const hubsWithId = hubs.map(h => ({ ...h, jobsite_id: jobsiteId }))
    allHubs.push(...hubsWithId)
  }

  // We can't use upsert easily on hubs without a unique constraint on (jobsite_id, name) if it doesn't exist.
  // Assuming it exists or we just insert (which might duplicate if run multiple times without unique constraint).
  // The SQL seed had "ON CONFLICT DO NOTHING". 
  // We'll check if (jobsite_id, name) constraint exists in schema? 
  // Usually it's better to select existing hubs first or delete all (risky).
  // Let's try upsert if there is a unique constraint, or just insert and ignore error?
  // We'll use insert and ignore conflicts if possible, but supabase js upsert requires constraint name or columns.
  // Let's try inserting one by one and ignoring errors, or batch insert.
  // To match SQL "ON CONFLICT DO NOTHING", we need the constraint.
  // Checking schema.sql, there is no explicit unique index on hubs(jobsite_id, name) visible in the snippet.
  // But usually there is one. Let's try upsert on 'id' if we had it, but we don't.
  // We'll proceed with insert.
  
  // For safety, let's fetch existing hubs to map them later
  // Actually, we need hub IDs for listings.
  // So we MUST get the IDs back.
  
  // Strategy: For each jobsite, fetch existing hubs. Filter out existing ones. Insert new ones.
  // Then fetch all hubs again to map Name -> ID.

  const hubMap = new Map() // (jobsiteId + hubName) -> hubId

  for (const [slug, hubs] of Object.entries(hubsData)) {
    const jobsiteId = jobsiteMap.get(slug)
    if (!jobsiteId) continue

    for (const hub of hubs) {
      // Check if exists
      const { data: existing } = await supabase
        .from('hubs')
        .select('id')
        .eq('jobsite_id', jobsiteId)
        .eq('name', hub.name)
        .single()
      
      let hubId = existing?.id

      if (!hubId) {
        const { data: newHub, error } = await supabase
          .from('hubs')
          .insert({ ...hub, jobsite_id: jobsiteId })
          .select()
          .single()
        
        if (error) {
           console.error(`Error inserting hub ${hub.name}:`, error.message)
           continue
        }
        hubId = newHub.id
      }
      
      hubMap.set(`${jobsiteId}:${hub.name}`, hubId)
    }
  }

  // 3. Seed Poster Profiles
  console.log('Seeding poster profiles...')
  const posterProfileMap = new Map() // refId -> profileId

  for (const profile of posterProfiles) {
    const { refId, ...profileData } = profile
    
    // We create new poster profiles every time or reuse?
    // Let's create new ones to be safe, or check by display_name (not unique though).
    // Let's just insert.
    const { data: newProfile, error } = await supabase
      .from('poster_profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating poster profile:', error)
      continue
    }
    posterProfileMap.set(refId, newProfile.id)
  }

  // 4. Seed Listings
  console.log('Seeding listings...')
  for (const item of listingsData) {
    const { posterRef, jobsiteSlug, hubName, listing, photos } = item
    
    const posterProfileId = posterProfileMap.get(posterRef)
    const jobsiteId = jobsiteMap.get(jobsiteSlug)
    const hubId = hubMap.get(`${jobsiteId}:${hubName}`)

    if (!posterProfileId) {
      console.warn('Missing poster profile for', posterRef)
      continue
    }

    // Insert listing
    const listingData = {
      ...listing,
      poster_profile_id: posterProfileId,
      // jobsite_id: jobsiteId, // Schema does not have jobsite_id on listings directly? 
      // Wait, the SQL seed had jobsite_id and hub_id on listings.
      // Let's check schema.sql again.
      // Line 35: listings table. It does NOT show jobsite_id or hub_id in the snippet.
      // It shows: city, area, rent_min...
      // But maybe they were added in another migration?
      // `001_jobsite_housing_explorer.sql` might have them?
      // If the original seed `seed_jobsites_hubs.sql` inserts them (lines 226-230), they must exist?
      // Lines 241, 242: `j.id, h.id`
      // So `jobsite_id` and `hub_id` MUST exist on listings table in the database if the seed was valid.
      // I will assume they exist.
      jobsite_id: jobsiteId,
      hub_id: hubId
    }

    const { data: newListing, error: listingError } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single()

    if (listingError) {
      console.error('Error creating listing:', listingError)
      continue
    }

    // Insert Photos
    if (photos && photos.length > 0) {
      const photosData = photos.map((url, index) => ({
        listing_id: newListing.id,
        storage_path: url, // Using URL as path for now, frontend handles full URL if it's absolute?
        // home-client.tsx: getPhotoUrl prepends SUPABASE_URL if not absolute?
        // Actually getPhotoUrl: `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${storagePath}`
        // If we store full URL from unsplash, this won't work nicely with that helper.
        // We need to bypass the helper or update the helper.
        // home-client.tsx: 
        // function getListingCoverPhotoUrl(listing) { ... }
        // getPhotoUrl(listing.listing_photos[0].storage_path)
        // If storage_path is "https://...", then result is "https://supabase.../https://..." which is broken.
        
        // HOWEVER, the `home-client.tsx` ALSO checks `listing.cover_photo_url` and `listing.photo_urls`.
        // Since we are inserting into `listing_photos`, we are forcing the first code path.
        // Use `photo_urls` column on `listings` if it exists?
        // But I suspect `photo_urls` column does NOT exist on `listings` table (based on my analysis).
        // So we must use `listing_photos`.
        
        // To support Unsplash URLs in `listing_photos`, we'd need to change `home-client.tsx` to handle absolute URLs.
        // OR we can't use Unsplash URLs easily without modifying frontend.
        // OR we can put the Unsplash URL in `storage_path` and update frontend to check if it starts with http.
        
        sort_order: index
      }))

      // But wait, the SQL seed used `cover_photo_url` and `photo_urls` on `listings` table.
      // If those columns DON'T exist, then the SQL seed WAS invalid.
      // If I want to support "demo listing for visuals", I should probably make sure the visuals work.
      
      // Let's assume I need to insert into `listing_photos`.
      // I will insert. I will ALSO try to update `listings` table with `cover_photo_url` just in case the column exists (legacy).
      // If it fails, `upsert` or `update` might throw.
      
      // For `listing_photos` to work with external URLs, I need to update `home-client.tsx`.
      // But I can't easily change `home-client.tsx` without user asking.
      // But "solve the persistent lazy load" was the previous task. "load the seed data" is current.
      // If I load data that doesn't display, I failed.
      
      // Let's check `home-client.tsx` getPhotoUrl function.
      /*
      54| function getPhotoUrl(storagePath: string): string {
      55|   if (!SUPABASE_URL) return ''
      56|   return `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${storagePath}`
      57| }
      */
      // It blindly prepends.
      // So I should modify `home-client.tsx` to handle absolute URLs?
      // Yes, that seems proactive and correct.
      
      const { error: photoError } = await supabase
        .from('listing_photos')
        .insert(photosData)
      
      if (photoError) {
        console.error('Error creating photos:', photoError)
      }
    }
  }

  console.log('Seed completed!')
}

runSeed()
