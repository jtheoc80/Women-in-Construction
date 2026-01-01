-- Migration: Fix profiles UX (visible profile + stricter public reads)
-- Goals:
-- - Ensure every new auth user gets a public.profiles row with a visible display_name
-- - Keep public browsing allowed, but do NOT expose private profile fields
-- - Maintain updated_at automatically

-- ============================================================
-- 1) Align profiles table to the app’s required schema
-- ============================================================
ALTER TABLE IF EXISTS public.profiles
  DROP COLUMN IF EXISTS last_initial,
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS bio;

-- Ensure required columns exist (id + timestamps should already exist from 002)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- 2) Trigger: auto-create profile on auth.users insert
--    (ensure a visible default display_name)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (NEW.id, 'New user', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3) Trigger: maintain updated_at
-- ============================================================
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

-- ============================================================
-- 4) RLS: users can select/update their own profile
--    public can only read display_name (column privileges)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any prior policies (names from older migration)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view display names" ON public.profiles;

-- Public (anon) can read rows, but only allowed columns (see GRANT below)
CREATE POLICY "Public can read profile display_name"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can read/update/insert only their own row
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 5) Column privileges: anon can only see safe fields
-- ============================================================
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;

-- anon can only SELECT id + display_name (+ timestamps are safe)
GRANT SELECT (id, display_name, created_at, updated_at) ON public.profiles TO anon;

-- authenticated can read + update their own row (RLS enforces row ownership)
GRANT SELECT (id, display_name, first_name, home_city, created_at, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, first_name, home_city, updated_at) ON public.profiles TO authenticated;
GRANT INSERT (id, display_name, first_name, home_city, created_at, updated_at) ON public.profiles TO authenticated;

-- ============================================================
-- 6) Safe view (optional): expose only public fields
-- ============================================================
CREATE OR REPLACE VIEW public.profile_display AS
SELECT id, display_name
FROM public.profiles;

GRANT SELECT ON public.profile_display TO anon;
GRANT SELECT ON public.profile_display TO authenticated;

