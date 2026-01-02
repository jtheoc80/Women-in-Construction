-- Migration: Ensure listings RLS allows anonymous read access
-- This migration ensures that anonymous users can read listings for the public browse feature.
-- Note: poster_profiles table is NOT used - listings are linked directly to profiles via user_id

-- ============================================================
-- 1) ENSURE RLS IS ENABLED ON LISTINGS TABLE
-- ============================================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2) DROP AND RECREATE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can view own listings" ON public.listings;
DROP POLICY IF EXISTS "Anon can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;

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
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- ============================================================
-- 4) CREATE INSERT/UPDATE/DELETE POLICIES
-- ============================================================

CREATE POLICY "Users can insert listings"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update own listings"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own listings"
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5) GRANT PERMISSIONS
-- ============================================================
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
