-- SiteSisters Auth + RLS schema (Supabase)
-- Requires:
-- - Supabase Auth enabled (auth.users)
-- - Extensions: pgcrypto

create extension if not exists pgcrypto;

-- =========================================================
-- public.profiles (keyed by auth.users.id)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  company text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- =========================================================
-- public.profile_contacts (private contact info)
-- =========================================================
create table if not exists public.profile_contacts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  contact_preference text not null check (contact_preference in ('email', 'phone', 'instagram', 'other')),
  contact_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profile_contacts_updated_at on public.profile_contacts;
create trigger set_profile_contacts_updated_at
before update on public.profile_contacts
for each row
execute function public.set_updated_at();

alter table public.profile_contacts enable row level security;

drop policy if exists "profile_contacts_select_self" on public.profile_contacts;
create policy "profile_contacts_select_self"
on public.profile_contacts
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "profile_contacts_insert_self" on public.profile_contacts;
create policy "profile_contacts_insert_self"
on public.profile_contacts
for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "profile_contacts_update_self" on public.profile_contacts;
create policy "profile_contacts_update_self"
on public.profile_contacts
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- =========================================================
-- public.listings (owned by auth.uid())
-- =========================================================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text,
  city text not null,
  area text,
  rent_min integer,
  rent_max integer,
  move_in date,
  room_type text not null check (room_type in ('private_room', 'shared_room', 'entire_place')),
  commute_area text,
  details text,
  tags text[],
  place_id text,
  lat double precision,
  lng double precision,
  -- Note: if you need strict privacy, move this into a separate owner-only table.
  full_address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_city_idx on public.listings(city);
create index if not exists listings_is_active_idx on public.listings(is_active);

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row
execute function public.set_updated_at();

alter table public.listings enable row level security;

drop policy if exists "listings_select_active_or_owner" on public.listings;
create policy "listings_select_active_or_owner"
on public.listings
for select
to authenticated
using (is_active = true or owner_id = auth.uid());

drop policy if exists "listings_insert_owner" on public.listings;
create policy "listings_insert_owner"
on public.listings
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "listings_update_owner" on public.listings;
create policy "listings_update_owner"
on public.listings
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "listings_delete_owner" on public.listings;
create policy "listings_delete_owner"
on public.listings
for delete
to authenticated
using (owner_id = auth.uid());

-- =========================================================
-- public.listing_photos (optional, supports /api/upload + /design carousel)
-- =========================================================
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_listing_id_idx on public.listing_photos(listing_id);

alter table public.listing_photos enable row level security;

drop policy if exists "listing_photos_select_visible" on public.listing_photos;
create policy "listing_photos_select_visible"
on public.listing_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.is_active = true or l.owner_id = auth.uid())
  )
);

drop policy if exists "listing_photos_insert_owner" on public.listing_photos;
create policy "listing_photos_insert_owner"
on public.listing_photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
);

drop policy if exists "listing_photos_delete_owner" on public.listing_photos;
create policy "listing_photos_delete_owner"
on public.listing_photos
for delete
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id = auth.uid()
  )
);

-- =========================================================
-- public.intro_requests (requester_id / owner_id tied to auth.uid())
-- =========================================================
create table if not exists public.intro_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intro_requests_listing_id_idx on public.intro_requests(listing_id);
create index if not exists intro_requests_requester_id_idx on public.intro_requests(requester_id);
create index if not exists intro_requests_owner_id_idx on public.intro_requests(owner_id);

drop trigger if exists set_intro_requests_updated_at on public.intro_requests;
create trigger set_intro_requests_updated_at
before update on public.intro_requests
for each row
execute function public.set_updated_at();

alter table public.intro_requests enable row level security;

drop policy if exists "intro_requests_select_parties" on public.intro_requests;
create policy "intro_requests_select_parties"
on public.intro_requests
for select
to authenticated
using (requester_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "intro_requests_insert_requester" on public.intro_requests;
create policy "intro_requests_insert_requester"
on public.intro_requests
for insert
to authenticated
with check (
  requester_id = auth.uid()
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.owner_id = owner_id
      and l.is_active = true
  )
);

drop policy if exists "intro_requests_update_parties" on public.intro_requests;
create policy "intro_requests_update_parties"
on public.intro_requests
for update
to authenticated
using (requester_id = auth.uid() or owner_id = auth.uid())
with check (requester_id = auth.uid() or owner_id = auth.uid());

