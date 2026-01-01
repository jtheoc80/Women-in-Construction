create extension if not exists pgcrypto;

-- Profiles (one per Clerk user)
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

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  city text not null,
  area text,
  rent_min int,
  rent_max int,
  move_in date,
  room_type text not null default 'private_room', -- private_room | shared_room | entire_place
  commute_area text,
  details text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists listings_city_idx on public.listings(city);
create index if not exists listings_created_at_idx on public.listings(created_at desc);

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
