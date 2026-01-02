-- Migration: Photo uploads, poster profiles, and profile contacts for listings
-- This adds support for:
-- - Anonymous poster profiles (separate from auth-based profiles)
-- - Private contact information
-- - Photo uploads via Supabase Storage
-- - Address/location data via Google Places

-- ============================================================
-- 1) POSTER PROFILES (public - for anonymous listing posters)
-- Separate from auth-based profiles for the /design prototype
-- ============================================================
CREATE TABLE IF NOT EXISTS public.poster_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  company text NOT NULL,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS poster_profiles_created_at_idx ON public.poster_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE public.poster_profiles ENABLE ROW LEVEL SECURITY;

-- Anon can read poster profiles (public info)
CREATE POLICY "Anon can read poster profiles"
  ON public.poster_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Service role can do everything (for API routes)
-- No explicit policy needed - service role bypasses RLS

-- ============================================================
-- 2) PROFILE CONTACTS (PRIVATE - never exposed to anon)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  profile_id uuid PRIMARY KEY REFERENCES public.poster_profiles(id) ON DELETE CASCADE,
  contact_preference text NOT NULL DEFAULT 'email', -- email | phone | instagram | other
  contact_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS - NO anon access
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

-- No anon policies - only service role can access
-- Service role bypasses RLS automatically

-- ============================================================
-- 3) LISTING PHOTOS (publicly readable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_photos_listing_id_idx ON public.listing_photos(listing_id);
CREATE INDEX IF NOT EXISTS listing_photos_sort_order_idx ON public.listing_photos(listing_id, sort_order);

-- Enable RLS
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

-- Anon can read photos for active listings
CREATE POLICY "Anon can read photos for active listings"
  ON public.listing_photos
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE id = listing_photos.listing_id 
      AND is_active = true
    )
  );

-- ============================================================
-- 4) MODIFY LISTINGS - add profile reference and location fields
-- ============================================================
-- Make user_id nullable for anonymous listings (only require one of user_id or poster_profile_id)
ALTER TABLE public.listings 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add poster_profile_id for anonymous posters (separate from user_id which is for auth users)
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS poster_profile_id uuid REFERENCES public.poster_profiles(id) ON DELETE SET NULL;

-- Add Google Places fields
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- Add title field for listings (from the spec)
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS title text;

-- Add tags field for listings
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS tags text[];

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS listings_lat_lng_idx ON public.listings(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_poster_profile_id_idx ON public.listings(poster_profile_id) WHERE poster_profile_id IS NOT NULL;

-- ============================================================
-- 5) RATE LIMITS TABLE (for API rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL, -- IP address or user ID
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_bucket_identifier_window_idx 
  ON public.rate_limits(bucket, identifier, window_start);

-- Enable RLS - no anon access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies for anon - only service role can access

-- ============================================================
-- 6) GRANT PERMISSIONS
-- ============================================================
-- Grant select on public tables to anon
GRANT SELECT ON public.poster_profiles TO anon;
GRANT SELECT ON public.listing_photos TO anon;

-- Note: profile_contacts and rate_limits have no anon grants (private)
