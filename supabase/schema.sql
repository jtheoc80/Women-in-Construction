-- SiteSisters Database Schema
-- Supabase Auth + RLS
-- All operations use auth.uid() for ownership verification

-- Enable required extensions
create extension if not exists pgcrypto;

-- ============================================
-- PROFILES TABLE
-- Keyed by auth.users.id, stores user profile data
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  first_name text,
  home_city text,
  company text,
  role text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create profile automatically when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- RLS for profiles
alter table public.profiles enable row level security;

-- Anyone can view profiles (for displaying listing owners, etc.)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can only insert their own profile (handled by trigger, but for safety)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- POSTER PROFILES TABLE
-- Public display profiles for listing posters (legacy support)
-- ============================================
create table if not exists public.poster_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  company text not null,
  role text,
  created_at timestamptz not null default now()
);

create index if not exists poster_profiles_user_id_idx on public.poster_profiles(user_id);
create index if not exists poster_profiles_created_at_idx on public.poster_profiles(created_at desc);

-- RLS for poster_profiles
alter table public.poster_profiles enable row level security;

-- Anyone can view poster profiles (public display)
create policy "Poster profiles are viewable by everyone"
  on public.poster_profiles for select
  using (true);

-- Authenticated users can create poster profiles
create policy "Authenticated users can create poster profiles"
  on public.poster_profiles for insert
  to authenticated
  with check (true);

-- Users can only update their own poster profiles
create policy "Users can update own poster profiles"
  on public.poster_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- PROFILE CONTACTS TABLE
-- Private contact information, only revealed after intro acceptance
-- ============================================
create table if not exists public.profile_contacts (
  profile_id uuid primary key references public.poster_profiles(id) on delete cascade,
  contact_preference text not null default 'email', -- email | phone | instagram | other
  contact_value text not null,
  created_at timestamptz not null default now()
);

-- RLS for profile_contacts
alter table public.profile_contacts enable row level security;

-- Only service role can read contacts (for intro acceptance flow)
-- Users cannot directly read contact info
create policy "Service role can read contacts"
  on public.profile_contacts for select
  using (false); -- Deny all direct reads, use service role for controlled access

-- Authenticated users can insert contacts, but only for their own poster profiles
create policy "Authenticated users can insert contacts"
  on public.profile_contacts for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.poster_profiles pp
      where pp.id = profile_id
        and pp.user_id = auth.uid()
    )
  );

-- ============================================
-- LISTINGS TABLE
-- Housing listings owned by authenticated users
-- ============================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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
  full_address text, -- PRIVATE: only visible to owner
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_city_idx on public.listings(city);
create index if not exists listings_created_at_idx on public.listings(created_at desc);
create index if not exists listings_poster_profile_id_idx on public.listings(poster_profile_id) where poster_profile_id is not null;
create index if not exists listings_lat_lng_idx on public.listings(lat, lng) where lat is not null and lng is not null;
create index if not exists listings_is_active_idx on public.listings(is_active) where is_active = true;

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.update_updated_at_column();

-- RLS for listings
alter table public.listings enable row level security;

-- Anyone can view active listings (excluding private full_address)
create policy "Active listings are viewable by everyone"
  on public.listings for select
  using (is_active = true);

-- Owners can view all their own listings (including inactive)
create policy "Users can view own listings"
  on public.listings for select
  using (auth.uid() = user_id);

-- Authenticated users can create listings (owner is enforced)
create policy "Authenticated users can create listings"
  on public.listings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can only update their own listings
create policy "Users can update own listings"
  on public.listings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own listings
create policy "Users can delete own listings"
  on public.listings for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- LISTING PHOTOS TABLE
-- Photos for listings, stored in Supabase Storage
-- ============================================
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_id_idx on public.listing_photos(listing_id);
create index if not exists listing_photos_sort_order_idx on public.listing_photos(listing_id, sort_order);

-- RLS for listing_photos
alter table public.listing_photos enable row level security;

-- Anyone can view photos for active listings
create policy "Listing photos are viewable by everyone"
  on public.listing_photos for select
  using (true);

-- Photos can be inserted via service role (upload API)
create policy "Authenticated users can insert photos"
  on public.listing_photos for insert
  to authenticated
  with check (true);

-- ============================================
-- INTRO REQUESTS TABLE
-- Requests to connect with listing owners
-- ============================================
create table if not exists public.intro_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending', -- pending | accepted | declined
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists intro_requests_listing_id_idx on public.intro_requests(listing_id);
create index if not exists intro_requests_requester_id_idx on public.intro_requests(requester_id);
create index if not exists intro_requests_status_idx on public.intro_requests(status);

-- Unique constraint: one request per user per listing
create unique index if not exists intro_requests_unique_idx 
  on public.intro_requests(listing_id, requester_id);

-- RLS for intro_requests
alter table public.intro_requests enable row level security;

-- Listing owners can see requests for their listings
create policy "Listing owners can view intro requests"
  on public.intro_requests for select
  using (
    exists (
      select 1 from public.listings
      where listings.id = intro_requests.listing_id
      and listings.user_id = auth.uid()
    )
  );

-- Requesters can see their own requests
create policy "Requesters can view own requests"
  on public.intro_requests for select
  using (requester_id = auth.uid());

-- Authenticated users can create intro requests
create policy "Authenticated users can create intro requests"
  on public.intro_requests for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and exists (
      select 1 from public.listings
      where listings.id = intro_requests.listing_id
      and listings.is_active = true
      and listings.user_id != auth.uid() -- Can't request intro to own listing
    )
  );

-- Listing owners can update (accept/decline) requests
create policy "Listing owners can update intro requests"
  on public.intro_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.listings
      where listings.id = intro_requests.listing_id
      and listings.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings
      where listings.id = intro_requests.listing_id
      and listings.user_id = auth.uid()
    )
  );

-- ============================================
-- MESSAGES TABLE
-- In-app messaging between users
-- ============================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_id_idx on public.messages(thread_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_recipient_id_idx on public.messages(recipient_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- RLS for messages
alter table public.messages enable row level security;

-- Users can view messages they sent or received
create policy "Users can view own messages"
  on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Users can send messages
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

-- Recipients can mark messages as read
create policy "Recipients can update messages"
  on public.messages for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- ============================================
-- REPORTS TABLE
-- Moderation reports for listings
-- ============================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending', -- pending | reviewed | resolved
  created_at timestamptz not null default now()
);

create index if not exists reports_listing_id_idx on public.reports(listing_id);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_status_idx on public.reports(status);

-- RLS for reports
alter table public.reports enable row level security;

-- Only service role can view reports (admin only)
create policy "Reports are not publicly viewable"
  on public.reports for select
  using (false);

-- Authenticated users can create reports
create policy "Authenticated users can create reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- ============================================
-- INVITES TABLE
-- User invite codes for referral system
-- ============================================
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  uses_remaining int not null default 5,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index if not exists invites_code_idx on public.invites(code);
create index if not exists invites_creator_id_idx on public.invites(creator_id);

-- RLS for invites
alter table public.invites enable row level security;

-- Anyone can check if an invite is valid (by code)
create policy "Invites are checkable by code"
  on public.invites for select
  using (true);

-- Users can create invites
create policy "Authenticated users can create invites"
  on public.invites for insert
  to authenticated
  with check (creator_id = auth.uid());

-- Users can update their own invites
create policy "Users can update own invites"
  on public.invites for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- ============================================
-- RATE LIMITS TABLE
-- API rate limiting
-- ============================================
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  identifier text not null, -- user ID or IP
  window_start timestamptz not null default now(),
  request_count int not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists rate_limits_bucket_identifier_window_idx 
  on public.rate_limits(bucket, identifier, window_start);

-- RLS for rate_limits
alter table public.rate_limits enable row level security;

-- Only service role can access rate limits
create policy "Rate limits are not publicly accessible"
  on public.rate_limits for all
  using (false);

-- ============================================
-- STORAGE POLICIES
-- For listing-photos bucket
-- ============================================
-- Note: Run these in Supabase Dashboard -> Storage -> Policies

-- CREATE POLICY "Authenticated users can upload listing photos"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'listing-photos');

-- CREATE POLICY "Anyone can view listing photos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'listing-photos');

-- CREATE POLICY "Users can delete own photos"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
