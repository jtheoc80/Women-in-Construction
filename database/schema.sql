create extension if not exists pgcrypto;

-- Profiles (one per Clerk user - for authenticated users)
create table if not exists public.profiles (
  user_id text primary key,
  display_name text not null,
  city text,
  bio text,
  contact_preference text not null default 'clerk_email', -- clerk_email | phone | instagram | other
  contact_value text, -- only revealed after acceptance
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Poster Profiles (publicly readable - for anonymous listing posters)
create table if not exists public.poster_profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  company text not null,
  role text,
  created_at timestamptz not null default now()
);

create index if not exists poster_profiles_created_at_idx on public.poster_profiles(created_at desc);

-- Profile Contacts (PRIVATE - never exposed to anon)
create table if not exists public.profile_contacts (
  profile_id uuid primary key references public.poster_profiles(id) on delete cascade,
  contact_preference text not null default 'email', -- email | phone | instagram | other
  contact_value text not null,
  created_at timestamptz not null default now()
);

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(user_id) on delete cascade, -- nullable for anonymous listings
  poster_profile_id uuid references public.poster_profiles(id) on delete set null,
  title text,
  city text not null,
  area text,
  rent_min int,
  rent_max int,
  move_in date,
  room_type text not null default 'private_room', -- private_room | shared_room | entire_place
  commute_area text,
  details text,
  tags text[],
  place_id text,
  lat double precision,
  lng double precision,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Listing Photos (publicly readable)
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_id_idx on public.listing_photos(listing_id);
create index if not exists listing_photos_sort_order_idx on public.listing_photos(listing_id, sort_order);

create index if not exists listings_city_idx on public.listings(city);
create index if not exists listings_created_at_idx on public.listings(created_at desc);
create index if not exists listings_poster_profile_id_idx on public.listings(poster_profile_id) where poster_profile_id is not null;
create index if not exists listings_lat_lng_idx on public.listings(lat, lng) where lat is not null and lng is not null;

-- Intro requests
create table if not exists public.intro_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_user_id text not null references public.profiles(user_id) on delete cascade,
  message text,
  status text not null default 'pending', -- pending | accepted | declined
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists intro_requests_listing_idx on public.intro_requests(listing_id);
create index if not exists intro_requests_requester_idx on public.intro_requests(requester_user_id);

-- Reports (basic moderation)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_user_id text not null references public.profiles(user_id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

-- Rate Limits (for API rate limiting - no anon access)
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null, -- IP address or user ID
  window_start timestamptz not null default now(),
  request_count int not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists rate_limits_bucket_identifier_window_idx 
  on public.rate_limits(bucket, identifier, window_start);
