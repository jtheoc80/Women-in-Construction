-- Migration: Ensure public access to listings and poster profiles
-- Ensures that anonymous users can definitely read active listings and their related poster profiles.

-- Enable RLS on listings (idempotent)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 1. Listings Policies
-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Anon can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Public can view active listings" ON public.listings;

-- Allow anonymous access to active listings
CREATE POLICY "Public can view active listings"
ON public.listings
FOR SELECT
TO anon
USING (is_active = true);

-- Allow authenticated access to active listings
CREATE POLICY "Authenticated can view active listings"
ON public.listings
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2. Poster Profiles Policies
-- Listings join with poster_profiles, so public must be able to read them too.
ALTER TABLE public.poster_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read poster profiles" ON public.poster_profiles;
DROP POLICY IF EXISTS "Public can read poster profiles" ON public.poster_profiles;

CREATE POLICY "Public can read poster profiles"
ON public.poster_profiles
FOR SELECT
TO anon
USING (true);

-- 3. Grant Permissions
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.poster_profiles TO anon;
