-- Migration: Ensure listings RLS allows anonymous read access
-- This migration ensures that anonymous users can read listings for the public browse feature.

-- ============================================================
-- 1) ENSURE RLS IS ENABLED ON LISTINGS TABLE
-- ============================================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2) DROP AND RECREATE POLICIES FOR CLARITY
-- ============================================================

-- Drop existing policies to recreate them with correct configuration
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view own listings" ON public.listings;
DROP POLICY IF EXISTS "Anon can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;

-- ============================================================
-- 3) CREATE SELECT POLICIES
-- ============================================================

-- Anonymous users can view active listings (public browsing)
CREATE POLICY "Anon can view active listings"
  ON public.listings
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated users can view active listings
CREATE POLICY "Authenticated can view active listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Authenticated users can also view their own listings (including inactive)
CREATE POLICY "Users can view own listings"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid()::text);

-- ============================================================
-- 4) CREATE INSERT/UPDATE/DELETE POLICIES FOR AUTHENTICATED USERS
-- ============================================================

-- Users can insert listings (user_id will be set by API route)
CREATE POLICY "Users can insert listings"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid()::text);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- ============================================================
-- 5) ENSURE POSTER_PROFILES IS READABLE BY ANON
-- ============================================================
-- (This should already exist from migration 006, but ensure it's there)

-- First check if policy exists, drop if it does
DROP POLICY IF EXISTS "Anon can read poster profiles" ON public.poster_profiles;
DROP POLICY IF EXISTS "Authenticated can read poster profiles" ON public.poster_profiles;

-- Anon can read poster profiles (public info)
CREATE POLICY "Anon can read poster profiles"
  ON public.poster_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated can read poster profiles
CREATE POLICY "Authenticated can read poster profiles"
  ON public.poster_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 6) GRANT NECESSARY PERMISSIONS
-- ============================================================
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.poster_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT ON public.poster_profiles TO authenticated;
