import type { RawListing } from './listings/normalize'

/**
 * Demo listings data with local fallback images
 * 
 * Uses local /demo/listings/*.jpg images as primary source to ensure
 * images always load, with Unsplash URLs as secondary option.
 */
export const DEMO_LISTINGS: RawListing[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user-1',
    title: 'Sunny Room near Data Center',
    city: 'Ashburn',
    area: 'Loudoun County',
    rent_min: 800,
    rent_max: 950,
    move_in: new Date().toISOString(),
    room_type: 'private_room',
    commute_area: 'Data Center Alley',
    details: 'Spacious private room in a quiet townhouse. Shared kitchen and bath. Perfect for construction professionals.',
    tags: ['Parking', 'Wifi', 'Laundry'],
    is_active: true,
    is_demo: true,
    created_at: new Date().toISOString(),
    poster_profiles: {
      id: 'poster-1',
      display_name: 'Sarah M.',
      company: 'Turner Construction',
      role: 'Project Engineer'
    },
    // Local image as primary, guaranteed to work
    cover_photo_url: '/demo/listings/1.jpg',
    photo_urls: [
      '/demo/listings/1.jpg',
      '/demo/listings/2.jpg'
    ]
  },
  {
    id: 'demo-2',
    user_id: 'demo-user-2',
    title: 'Shared Room - Weekly Rates',
    city: 'Phoenix',
    area: 'Chandler',
    rent_min: 400,
    rent_max: 500,
    move_in: new Date().toISOString(),
    room_type: 'shared_room',
    commute_area: 'Intel Ocotillo',
    details: 'Shared room with one other female roommate. Close to Intel site. Weekly cleaning included.',
    tags: ['Short-term', 'Furnished', 'No Deposit'],
    is_active: true,
    is_demo: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    poster_profiles: {
      id: 'poster-2',
      display_name: 'Maria R.',
      company: 'DPR Construction',
      role: 'Safety Manager'
    },
    cover_photo_url: '/demo/listings/2.jpg',
    photo_urls: [
      '/demo/listings/2.jpg'
    ]
  },
  {
    id: 'demo-3',
    user_id: 'demo-user-3',
    title: 'Entire Basement Apartment',
    city: 'Columbus',
    area: 'New Albany',
    rent_min: 1200,
    rent_max: 1200,
    move_in: new Date(Date.now() + 86400000 * 7).toISOString(),
    room_type: 'entire_place',
    commute_area: 'Intel Ohio',
    details: 'Fully furnished basement apartment with private entrance. Kitchenette and private bath.',
    tags: ['Private Entrance', 'Kitchenette', 'Pets Allowed'],
    is_active: true,
    is_demo: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    poster_profiles: {
      id: 'poster-3',
      display_name: 'Jessica T.',
      company: 'Bechtel',
      role: 'Electrician'
    },
    cover_photo_url: '/demo/listings/3.jpg',
    photo_urls: [
      '/demo/listings/3.jpg'
    ]
  },
  {
    id: 'demo-4',
    user_id: 'demo-user-4',
    title: 'Room in quiet house',
    city: 'Prineville',
    area: 'Crook County',
    rent_min: 750,
    rent_max: 750,
    move_in: new Date().toISOString(),
    room_type: 'private_room',
    commute_area: 'Meta Data Center',
    details: 'Looking for a clean and respectful roommate. I work at the data center too.',
    tags: ['Quiet', 'Non-smoking', 'Yard'],
    is_active: true,
    is_demo: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    poster_profiles: {
      id: 'poster-4',
      display_name: 'Ashley K.',
      company: 'Rosendin',
      role: 'Foreman'
    },
    cover_photo_url: '/demo/listings/4.jpg',
    photo_urls: [
      '/demo/listings/4.jpg'
    ]
  },
  {
    id: 'demo-5',
    user_id: 'demo-user-5',
    title: 'Master Bedroom with Bath',
    city: 'San Antonio',
    area: 'Westover Hills',
    rent_min: 1000,
    rent_max: 1100,
    move_in: new Date(Date.now() + 86400000 * 3).toISOString(),
    room_type: 'private_room',
    commute_area: 'Microsoft Data Center',
    details: 'Huge master bedroom with walk-in closet and en-suite bathroom. Pool access.',
    tags: ['Pool', 'Gym', 'Gated Community'],
    is_active: true,
    is_demo: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    poster_profiles: {
      id: 'poster-5',
      display_name: 'Elena G.',
      company: 'Holder Construction',
      role: 'Field Engineer'
    },
    cover_photo_url: '/demo/listings/5.jpg',
    photo_urls: [
      '/demo/listings/5.jpg'
    ]
  },
  {
    id: 'demo-6',
    user_id: 'demo-user-6',
    title: 'Cozy Room - Female Only',
    city: 'Huntsville',
    area: 'Madison',
    rent_min: 600,
    rent_max: 600,
    move_in: new Date().toISOString(),
    room_type: 'private_room',
    commute_area: 'Meta Huntsville',
    details: 'Cute room in a 3bd/2ba house. You would share a bathroom with one other person.',
    tags: ['Female Only', 'No Pets', 'Washer/Dryer'],
    is_active: true,
    is_demo: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    poster_profiles: {
      id: 'poster-6',
      display_name: 'Lisa M.',
      company: 'Meta',
      role: 'Logistics'
    },
    cover_photo_url: '/demo/listings/6.jpg',
    photo_urls: [
      '/demo/listings/6.jpg'
    ]
  }
];
