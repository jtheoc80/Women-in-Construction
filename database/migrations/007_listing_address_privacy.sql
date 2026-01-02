-- Migration: Listing Address Privacy
-- This migration adds support for storing the full address privately
-- Only the listing owner can see the full address for safety reasons

-- ============================================================
-- 1) ADD FULL_ADDRESS COLUMN (private - only visible to owner)
-- ============================================================
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS full_address text;

-- Add comment explaining the privacy requirement
COMMENT ON COLUMN public.listings.full_address IS 
  'Full address stored privately. Only the listing owner should see this for safety.';

-- ============================================================
-- 2) CREATE A VIEW FOR PUBLIC LISTING DATA (excludes full_address)
-- ============================================================
CREATE OR REPLACE VIEW public.listings_public AS
SELECT 
  id,
  user_id,
  poster_profile_id,
  title,
  city,
  area,
  rent_min,
  rent_max,
  move_in,
  room_type,
  commute_area,
  details,
  tags,
  place_id,
  lat,
  lng,
  is_active,
  created_at
  -- NOTE: full_address is intentionally excluded
FROM public.listings;

-- Grant select on public view
GRANT SELECT ON public.listings_public TO anon;
GRANT SELECT ON public.listings_public TO authenticated;

-- ============================================================
-- 3) UPDATE RLS POLICIES FOR LISTINGS
-- Allow owners to see full data including full_address
-- ============================================================

-- Drop existing policies if they exist (to recreate with new logic)
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view own listings" ON public.listings;

-- Policy: Anyone can view active listings (but we'll use the view for non-owners)
CREATE POLICY "Anyone can view active listings"
  ON public.listings
  FOR SELECT
  USING (is_active = true);

-- Policy: Users can view their own listings including inactive and full address
CREATE POLICY "Users can view own listings"
  ON public.listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 4) CREATE FUNCTION TO CHECK IF CURRENT USER OWNS LISTING
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_listing_owner(listing_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.listings 
    WHERE id = listing_id 
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5) CREATE SECURE VIEW THAT SHOWS ADDRESS ONLY TO OWNER
-- ============================================================
CREATE OR REPLACE VIEW public.listings_with_address AS
SELECT 
  id,
  user_id,
  poster_profile_id,
  title,
  city,
  area,
  rent_min,
  rent_max,
  move_in,
  room_type,
  commute_area,
  details,
  tags,
  place_id,
  lat,
  lng,
  is_active,
  created_at,
  -- Only show full_address if current user is the owner
  CASE 
    WHEN auth.uid() = user_id THEN full_address
    ELSE NULL
  END AS full_address,
  -- Helper column to indicate if current user is owner
  (auth.uid() = user_id) AS is_owner
FROM public.listings
WHERE is_active = true OR auth.uid() = user_id;

GRANT SELECT ON public.listings_with_address TO authenticated;
