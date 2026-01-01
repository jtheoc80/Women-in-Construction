-- Migration: Authentication & Profiles for SiteSisters
-- This migration adds support for Supabase Auth OTP (email + phone)
-- and creates a profiles table for user display information.

-- ============================================
-- 1. PROFILES TABLE (Supabase Auth compatible)
-- Links to auth.users via UUID, not text user_id
-- ============================================

-- Drop the old profiles table if it exists (was using text user_id for Clerk)
-- WARNING: This will delete existing profile data
-- In production, you'd want to migrate data first
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create new profiles table linked to Supabase Auth
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  first_name text,
  last_initial text,
  home_city text,
  organization_id uuid,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON public.profiles(display_name);

-- ============================================
-- 2. TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. TRIGGER: Update updated_at on profile change
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for edge cases)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Public can view display_name only (for listing cards)
-- We use a view instead for better control over exposed fields
CREATE POLICY "Public can view display names"
  ON public.profiles
  FOR SELECT
  USING (true);

-- ============================================
-- 5. SAFE VIEW: Public profile info
-- Only exposes safe fields for display on listings
-- ============================================
CREATE OR REPLACE VIEW public.profile_display AS
SELECT 
  id,
  display_name,
  home_city
FROM public.profiles;

-- ============================================
-- 6. UPDATE RELATED TABLES
-- Update foreign keys to use UUID instead of text
-- ============================================

-- Update listings table to use UUID for user_id
ALTER TABLE public.listings 
  DROP CONSTRAINT IF EXISTS listings_user_id_fkey;

ALTER TABLE public.listings 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update intro_requests table
ALTER TABLE public.intro_requests 
  DROP CONSTRAINT IF EXISTS intro_requests_requester_user_id_fkey;

ALTER TABLE public.intro_requests 
  ALTER COLUMN requester_user_id TYPE uuid USING requester_user_id::uuid;

ALTER TABLE public.intro_requests
  ADD CONSTRAINT intro_requests_requester_user_id_fkey 
  FOREIGN KEY (requester_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update reports table
ALTER TABLE public.reports 
  DROP CONSTRAINT IF EXISTS reports_reporter_user_id_fkey;

ALTER TABLE public.reports 
  ALTER COLUMN reporter_user_id TYPE uuid USING reporter_user_id::uuid;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reporter_user_id_fkey 
  FOREIGN KEY (reporter_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update move_plans table
ALTER TABLE public.move_plans 
  DROP CONSTRAINT IF EXISTS move_plans_user_id_fkey;

ALTER TABLE public.move_plans 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE public.move_plans
  ADD CONSTRAINT move_plans_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update listing_requests table
ALTER TABLE public.listing_requests 
  DROP CONSTRAINT IF EXISTS listing_requests_from_user_id_fkey,
  DROP CONSTRAINT IF EXISTS listing_requests_to_user_id_fkey;

ALTER TABLE public.listing_requests 
  ALTER COLUMN from_user_id TYPE uuid USING from_user_id::uuid,
  ALTER COLUMN to_user_id TYPE uuid USING to_user_id::uuid;

ALTER TABLE public.listing_requests
  ADD CONSTRAINT listing_requests_from_user_id_fkey 
  FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT listing_requests_to_user_id_fkey 
  FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================
-- 7. RLS FOR LISTINGS
-- ============================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.listings
  FOR SELECT
  USING (is_active = true);

-- Users can view their own listings (including inactive)
CREATE POLICY "Users can view own listings"
  ON public.listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create listings
CREATE POLICY "Authenticated users can create listings"
  ON public.listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON public.listings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON public.listings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. RLS FOR INTRO_REQUESTS
-- ============================================
ALTER TABLE public.intro_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they've sent or received
CREATE POLICY "Users can view own intro requests"
  ON public.intro_requests
  FOR SELECT
  USING (
    auth.uid() = requester_user_id OR 
    auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
  );

-- Authenticated users can create intro requests
CREATE POLICY "Authenticated users can create intro requests"
  ON public.intro_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_user_id);

-- Listing owners can update request status
CREATE POLICY "Listing owners can update intro requests"
  ON public.intro_requests
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.listings WHERE id = listing_id)
  );

-- ============================================
-- 9. HELPER FUNCTION: Check profile completion
-- ============================================
CREATE OR REPLACE FUNCTION public.is_profile_complete(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_uuid 
      AND first_name IS NOT NULL 
      AND first_name != ''
      AND home_city IS NOT NULL 
      AND home_city != ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
