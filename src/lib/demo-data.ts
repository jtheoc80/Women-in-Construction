
interface PosterProfile {
  id: string
  display_name: string
  company: string
  role: string | null
}

interface Listing {
  id: string
  user_id: string
  poster_profile_id: string | null
  title: string | null
  city: string
  area: string | null
  rent_min: number | null
  rent_max: number | null
  move_in: string | null
  room_type: string
  commute_area: string | null
  details: string | null
  tags: string[] | null
  place_id: string | null
  lat: number | null
  lng: number | null
  is_active: boolean
  created_at: string
  full_address?: string | null
  is_owner?: boolean
  poster_profiles?: PosterProfile | null
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  profiles?: { display_name: string }
  is_demo?: boolean
}

export const DEMO_LISTINGS: Partial<Listing>[] = [
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
    created_at: new Date().toISOString(),
    poster_profiles: {
      id: 'poster-1',
      display_name: 'Sarah M.',
      company: 'Turner Construction',
      role: 'Project Engineer'
    },
    cover_photo_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photo_urls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
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
    created_at: new Date(Date.now() - 86400000).toISOString(),
    poster_profiles: {
      id: 'poster-2',
      display_name: 'Maria R.',
      company: 'DPR Construction',
      role: 'Safety Manager'
    },
    cover_photo_url: 'https://images.unsplash.com/photo-1555854743-e3c2f6a5bb93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photo_urls: [
      'https://images.unsplash.com/photo-1555854743-e3c2f6a5bb93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
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
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    poster_profiles: {
      id: 'poster-3',
      display_name: 'Jessica T.',
      company: 'Bechtel',
      role: 'Electrician'
    },
    cover_photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photo_urls: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
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
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    poster_profiles: {
      id: 'poster-4',
      display_name: 'Ashley K.',
      company: 'Rosendin',
      role: 'Foreman'
    },
    cover_photo_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photo_urls: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
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
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    poster_profiles: {
      id: 'poster-5',
      display_name: 'Elena G.',
      company: 'Holder Construction',
      role: 'Field Engineer'
    },
    cover_photo_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photo_urls: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
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
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    poster_profiles: {
      id: 'poster-6',
      display_name: 'Lisa M.',
      company: 'Meta',
      role: 'Logistics'
    },
    cover_photo_url: 'https://images.unsplash.com/photo-1536349788264-1b816db3cc13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photo_urls: [
      'https://images.unsplash.com/photo-1536349788264-1b816db3cc13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ]
  }
];
