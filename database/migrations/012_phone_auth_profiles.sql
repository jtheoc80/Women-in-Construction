-- Migration: Phone Auth Support for Profiles
-- ============================================
-- This migration adds phone number support to profiles and ensures
-- the trigger properly handles both email and phone signups.

-- ============================================
-- 1. Add phone column to profiles if not exists
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- Create index for phone lookups (rare but useful for admin queries)
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone) WHERE phone IS NOT NULL;

-- ============================================
-- 2. Update handle_new_user trigger to capture phone from auth.users
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      -- Try to extract a name from email (before @)
      CASE 
        WHEN NEW.email IS NOT NULL AND NEW.email != '' 
        THEN split_part(NEW.email, '@', 1)
        ELSE NULL
      END,
      'New user'
    ),
    NEW.phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET 
      display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Update column privileges to include phone for authenticated users
-- ============================================

-- Revoke and re-grant to ensure clean state
-- Note: This only affects new grants, existing ones persist
GRANT SELECT (id, display_name, first_name, home_city, phone, created_at, updated_at) 
  ON public.profiles TO authenticated;
GRANT UPDATE (display_name, first_name, home_city, phone, updated_at) 
  ON public.profiles TO authenticated;
GRANT INSERT (id, display_name, first_name, home_city, phone, created_at, updated_at) 
  ON public.profiles TO authenticated;

-- Phone should NOT be visible to anon users (privacy)
-- anon grants remain unchanged from migration 003

-- ============================================
-- 4. Function to sync phone from auth.users to profiles
--    (useful for existing users who signed up with phone)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_profile_phone()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles p
  SET phone = u.phone, updated_at = NOW()
  FROM auth.users u
  WHERE p.id = u.id
    AND u.phone IS NOT NULL
    AND u.phone != ''
    AND (p.phone IS NULL OR p.phone = '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync once to backfill any existing phone users
SELECT public.sync_profile_phone();

-- ============================================
-- 5. Updated profile_display view (optional - keep phone private)
-- ============================================
CREATE OR REPLACE VIEW public.profile_display AS
SELECT id, display_name
FROM public.profiles;

-- Ensure grants on the view
GRANT SELECT ON public.profile_display TO anon;
GRANT SELECT ON public.profile_display TO authenticated;
