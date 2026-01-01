-- Migration: Jobsite Housing Explorer
-- This migration adds support for the "Plan My Move" feature
-- which helps women evaluate housing options near construction jobsites.

-- ============================================
-- 1. JOBSITES TABLE
-- Central table for construction/data center project sites
-- ============================================
CREATE TABLE IF NOT EXISTS public.jobsites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  slug text UNIQUE NOT NULL,
  lat numeric(10, 7),
  lng numeric(10, 7),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobsites_slug_idx ON public.jobsites(slug);
CREATE INDEX IF NOT EXISTS jobsites_state_idx ON public.jobsites(state);

-- ============================================
-- 2. HUBS TABLE
-- Towns/neighborhoods around a jobsite with commute info
-- ============================================
CREATE TABLE IF NOT EXISTS public.hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jobsite_id uuid NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  name text NOT NULL,
  commute_min int NOT NULL DEFAULT 0,  -- minimum commute in minutes
  commute_max int NOT NULL DEFAULT 30, -- maximum commute in minutes
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hubs_jobsite_idx ON public.hubs(jobsite_id);

-- ============================================
-- 3. UPDATE LISTINGS TABLE
-- Add jobsite/hub references and photo support
-- ============================================
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS jobsite_id uuid REFERENCES public.jobsites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hub_id uuid REFERENCES public.hubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS photo_urls text[],
  ADD COLUMN IF NOT EXISTS shift text DEFAULT 'day'; -- day | swing | night

CREATE INDEX IF NOT EXISTS listings_jobsite_idx ON public.listings(jobsite_id);
CREATE INDEX IF NOT EXISTS listings_hub_idx ON public.listings(hub_id);

-- ============================================
-- 4. LISTING_REQUESTS TABLE (for metrics)
-- Track intro requests for response time metrics
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  from_user_id text NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  to_user_id text NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS listing_requests_listing_idx ON public.listing_requests(listing_id);
CREATE INDEX IF NOT EXISTS listing_requests_status_idx ON public.listing_requests(status);

-- ============================================
-- 5. MOVE_PLANS TABLE
-- Stores user's saved search/plan criteria
-- ============================================
CREATE TABLE IF NOT EXISTS public.move_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  jobsite_id uuid NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  budget_min int,
  budget_max int,
  commute_max int DEFAULT 30,
  shift text DEFAULT 'day',
  room_type text DEFAULT 'private_room',
  move_in_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS move_plans_user_idx ON public.move_plans(user_id);
CREATE INDEX IF NOT EXISTS move_plans_jobsite_idx ON public.move_plans(jobsite_id);

-- ============================================
-- 6. HUB_METRICS_30D VIEW
-- Materialized metrics for hub ranking
-- ============================================
CREATE OR REPLACE VIEW public.hub_metrics_30d AS
SELECT 
  h.id AS hub_id,
  h.jobsite_id,
  h.name AS hub_name,
  h.commute_min,
  h.commute_max,
  
  -- Listing count in last 30 days
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.listings l 
     WHERE l.hub_id = h.id 
       AND l.is_active = true 
       AND l.created_at >= NOW() - INTERVAL '30 days'),
    0
  )::int AS listing_count_30d,
  
  -- Listing count in last 14 days (scarcity indicator)
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.listings l 
     WHERE l.hub_id = h.id 
       AND l.is_active = true 
       AND l.created_at >= NOW() - INTERVAL '14 days'),
    0
  )::int AS listing_count_14d,
  
  -- Median rent min
  (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.rent_min)
   FROM public.listings l 
   WHERE l.hub_id = h.id 
     AND l.is_active = true 
     AND l.rent_min IS NOT NULL
     AND l.created_at >= NOW() - INTERVAL '30 days')::int AS median_rent_min,
  
  -- Median rent max
  (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.rent_max)
   FROM public.listings l 
   WHERE l.hub_id = h.id 
     AND l.is_active = true 
     AND l.rent_max IS NOT NULL
     AND l.created_at >= NOW() - INTERVAL '30 days')::int AS median_rent_max,
  
  -- Median response time in hours (for accepted/declined requests)
  (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
     ORDER BY EXTRACT(EPOCH FROM (lr.responded_at - lr.created_at)) / 3600
   )
   FROM public.listing_requests lr
   JOIN public.listings l ON l.id = lr.listing_id
   WHERE l.hub_id = h.id
     AND lr.responded_at IS NOT NULL
     AND lr.created_at >= NOW() - INTERVAL '30 days')::numeric(10,1) AS median_response_hours

FROM public.hubs h;

-- ============================================
-- 7. JOBSITE_METRICS VIEW
-- Aggregate metrics at the jobsite level
-- ============================================
CREATE OR REPLACE VIEW public.jobsite_metrics AS
SELECT 
  j.id AS jobsite_id,
  j.slug,
  j.name AS jobsite_name,
  j.city,
  j.state,
  
  -- Total listings in last 14 days
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.listings l 
     WHERE l.jobsite_id = j.id 
       AND l.is_active = true 
       AND l.created_at >= NOW() - INTERVAL '14 days'),
    0
  )::int AS listings_14d,
  
  -- Average response time
  (SELECT AVG(EXTRACT(EPOCH FROM (lr.responded_at - lr.created_at)) / 3600)
   FROM public.listing_requests lr
   JOIN public.listings l ON l.id = lr.listing_id
   WHERE l.jobsite_id = j.id
     AND lr.responded_at IS NOT NULL
     AND lr.created_at >= NOW() - INTERVAL '30 days')::numeric(10,1) AS avg_response_hours,
  
  -- Total active listings
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.listings l 
     WHERE l.jobsite_id = j.id 
       AND l.is_active = true),
    0
  )::int AS total_active_listings

FROM public.jobsites j
WHERE j.is_active = true;

-- ============================================
-- 8. RLS POLICIES (Row Level Security)
-- ============================================
ALTER TABLE public.jobsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.move_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_requests ENABLE ROW LEVEL SECURITY;

-- Jobsites: readable by all
CREATE POLICY "Jobsites are viewable by everyone" 
  ON public.jobsites FOR SELECT 
  USING (true);

-- Hubs: readable by all
CREATE POLICY "Hubs are viewable by everyone" 
  ON public.hubs FOR SELECT 
  USING (true);

-- Move plans: only owner can view/edit
CREATE POLICY "Users can view own move plans" 
  ON public.move_plans FOR SELECT 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own move plans" 
  ON public.move_plans FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own move plans" 
  ON public.move_plans FOR UPDATE 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own move plans" 
  ON public.move_plans FOR DELETE 
  USING (auth.uid()::text = user_id);

-- Listing requests: viewable by sender or listing owner
CREATE POLICY "Users can view their sent listing requests" 
  ON public.listing_requests FOR SELECT 
  USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);

CREATE POLICY "Users can create listing requests" 
  ON public.listing_requests FOR INSERT 
  WITH CHECK (auth.uid()::text = from_user_id);

CREATE POLICY "Listing owners can update requests" 
  ON public.listing_requests FOR UPDATE 
  USING (auth.uid()::text = to_user_id);
