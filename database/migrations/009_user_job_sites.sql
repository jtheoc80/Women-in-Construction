-- Migration: User Job Sites
-- Job Sites are saved project locations a contractor can reuse to generate proposals faster.
-- This is distinct from the public 'jobsites' table which lists major construction sites.

-- ============================================
-- 1. CREATE TABLE: user_job_sites
-- ============================================
CREATE TABLE public.user_job_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  last_proposal_at timestamptz,
  photo_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments for documentation
COMMENT ON TABLE public.user_job_sites IS 'User-created job sites for proposal generation';
COMMENT ON COLUMN public.user_job_sites.name IS 'User-defined name e.g. "Smith Bathroom Remodel"';
COMMENT ON COLUMN public.user_job_sites.status IS 'active or archived';
COMMENT ON COLUMN public.user_job_sites.last_proposal_at IS 'Timestamp of last proposal generated for this site';
COMMENT ON COLUMN public.user_job_sites.photo_count IS 'Cached count of photos for this job site';

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX user_job_sites_user_id_idx ON public.user_job_sites(user_id);
CREATE INDEX user_job_sites_created_at_idx ON public.user_job_sites(created_at DESC);
CREATE INDEX user_job_sites_status_idx ON public.user_job_sites(status) WHERE status = 'active';

-- ============================================
-- 3. TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_user_job_site_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_job_site_updated ON public.user_job_sites;
CREATE TRIGGER on_user_job_site_updated
  BEFORE UPDATE ON public.user_job_sites
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_job_site_update();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.user_job_sites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own job sites
CREATE POLICY "Users can view own job sites"
  ON public.user_job_sites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own job sites
CREATE POLICY "Users can insert own job sites"
  ON public.user_job_sites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own job sites
CREATE POLICY "Users can update own job sites"
  ON public.user_job_sites
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own job sites
CREATE POLICY "Users can delete own job sites"
  ON public.user_job_sites
  FOR DELETE
  USING (auth.uid() = user_id);
