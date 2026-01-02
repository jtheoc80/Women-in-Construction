-- Migration: Add data center job sites with additional metadata
-- Adds new columns to jobsites table for operator, project_type, status, etc.
-- Seeds 4 active data center build sites (3 TX, 1 LA)

-- ============================================
-- 1. ADD NEW COLUMNS TO JOBSITES TABLE
-- ============================================

ALTER TABLE public.jobsites
  ADD COLUMN IF NOT EXISTS operator text,
  ADD COLUMN IF NOT EXISTS project_type text DEFAULT 'Data Center',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active_build',
  ADD COLUMN IF NOT EXISTS county_or_parish text,
  ADD COLUMN IF NOT EXISTS nearest_town text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Update existing rows to have is_public = true (so they remain visible)
UPDATE public.jobsites SET is_public = true WHERE is_public IS NULL;

-- Create index for public filtering
CREATE INDEX IF NOT EXISTS jobsites_is_public_idx ON public.jobsites(is_public) WHERE is_public = true;

-- ============================================
-- 2. UPDATE RLS POLICY FOR ANON ACCESS
-- The existing policy already allows public read, but let's ensure 
-- anon users can specifically access is_public = true rows
-- ============================================

-- Drop and recreate the policy to be more explicit
DROP POLICY IF EXISTS "Jobsites are viewable by everyone" ON public.jobsites;

CREATE POLICY "Public jobsites viewable by everyone"
  ON public.jobsites FOR SELECT
  USING (is_public = true);

-- ============================================
-- 3. SEED THE 4 NEW DATA CENTER JOB SITES
-- ============================================

-- A) Armstrong County, TX (Google)
INSERT INTO public.jobsites (
  name, city, state, slug, 
  operator, project_type, status, 
  county_or_parish, nearest_town, notes,
  is_active, is_public, description
) VALUES (
  'Google Data Center Campus — Armstrong County',
  'Claude',
  'TX',
  'google-armstrong-county-tx',
  'Google',
  'Data Center',
  'active_build',
  'Armstrong County',
  'Claude',
  'Large-scale data center campus build in the Texas Panhandle; remote-area job site near Claude.',
  true,
  true,
  'Google data center campus construction project in Armstrong County, Texas.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operator = EXCLUDED.operator,
  project_type = EXCLUDED.project_type,
  status = EXCLUDED.status,
  county_or_parish = EXCLUDED.county_or_parish,
  nearest_town = EXCLUDED.nearest_town,
  notes = EXCLUDED.notes,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  updated_at = NOW();

-- B) Haskell County, TX (Google)
INSERT INTO public.jobsites (
  name, city, state, slug,
  operator, project_type, status,
  county_or_parish, nearest_town, notes,
  is_active, is_public, description
) VALUES (
  'Google Data Center Projects — Haskell County',
  'Haskell',
  'TX',
  'google-haskell-county-tx',
  'Google',
  'Data Center',
  'active_build',
  'Haskell County',
  'Haskell',
  'Reported multiple data center builds in Haskell County; remote West Texas job site.',
  true,
  true,
  'Google data center projects in Haskell County, Texas.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operator = EXCLUDED.operator,
  project_type = EXCLUDED.project_type,
  status = EXCLUDED.status,
  county_or_parish = EXCLUDED.county_or_parish,
  nearest_town = EXCLUDED.nearest_town,
  notes = EXCLUDED.notes,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  updated_at = NOW();

-- C) Taylor County, TX - Abilene (Stargate/OpenAI)
INSERT INTO public.jobsites (
  name, city, state, slug,
  operator, project_type, status,
  county_or_parish, nearest_town, notes,
  is_active, is_public, description
) VALUES (
  'Stargate AI Data Center Site — Abilene',
  'Abilene',
  'TX',
  'stargate-abilene-tx',
  'OpenAI (Stargate)',
  'AI Data Center',
  'active_build',
  'Taylor County',
  'Abilene',
  'Major AI data center construction site in Abilene area; large workforce demand during buildout.',
  true,
  true,
  'Stargate AI data center construction in Taylor County, Texas.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operator = EXCLUDED.operator,
  project_type = EXCLUDED.project_type,
  status = EXCLUDED.status,
  county_or_parish = EXCLUDED.county_or_parish,
  nearest_town = EXCLUDED.nearest_town,
  notes = EXCLUDED.notes,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  updated_at = NOW();

-- D) Richland Parish, LA (Meta)
INSERT INTO public.jobsites (
  name, city, state, slug,
  operator, project_type, status,
  county_or_parish, nearest_town, notes,
  is_active, is_public, description
) VALUES (
  'Meta Data Center Mega-Site — Richland Parish',
  'Rayville',
  'LA',
  'meta-richland-parish-la',
  'Meta',
  'Data Center',
  'active_build',
  'Richland Parish',
  'Rayville',
  'Large Meta data center project in Northeast Louisiana; remote-area job site with substantial supporting infrastructure.',
  true,
  true,
  'Meta data center mega-site in Richland Parish, Louisiana.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  operator = EXCLUDED.operator,
  project_type = EXCLUDED.project_type,
  status = EXCLUDED.status,
  county_or_parish = EXCLUDED.county_or_parish,
  nearest_town = EXCLUDED.nearest_town,
  notes = EXCLUDED.notes,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description,
  updated_at = NOW();
