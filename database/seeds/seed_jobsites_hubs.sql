-- Seed Data: Jobsites and Hubs
-- Major semiconductor and data center construction projects
-- Commute times are estimates based on typical traffic patterns

-- ============================================
-- JOBSITES
-- ============================================

-- Arizona
INSERT INTO public.jobsites (name, city, state, slug, lat, lng, description) VALUES
('TSMC Arizona', 'Phoenix', 'AZ', 'tsmc-arizona', 33.6668, -112.0060, 'Taiwan Semiconductor Manufacturing Company fab facility. Multiple phases of construction.'),
('Intel Ocotillo', 'Chandler', 'AZ', 'intel-ocotillo', 33.2369, -111.8693, 'Intel semiconductor manufacturing campus. Ongoing expansion projects.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Texas
INSERT INTO public.jobsites (name, city, state, slug, lat, lng, description) VALUES
('Samsung Taylor', 'Taylor', 'TX', 'samsung-taylor', 30.5708, -97.4093, 'Samsung semiconductor fab. Major construction project.'),
('Texas Instruments Richardson', 'Richardson', 'TX', 'ti-richardson', 32.9485, -96.7098, 'TI semiconductor facility expansion.'),
('Tesla Gigafactory Texas', 'Austin', 'TX', 'tesla-gigafactory-texas', 30.2240, -97.6170, 'Tesla vehicle and battery manufacturing.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Ohio
INSERT INTO public.jobsites (name, city, state, slug, lat, lng, description) VALUES
('Intel Ohio', 'New Albany', 'OH', 'intel-ohio', 40.0817, -82.8084, 'Intel mega-site semiconductor fab. Largest single private investment in Ohio history.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- New York
INSERT INTO public.jobsites (name, city, state, slug, lat, lng, description) VALUES
('Micron Syracuse', 'Clay', 'NY', 'micron-syracuse', 43.1917, -76.1857, 'Micron memory chip fab facility.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Idaho
INSERT INTO public.jobsites (name, city, state, slug, lat, lng, description) VALUES
('Micron Boise', 'Boise', 'ID', 'micron-boise', 43.5949, -116.2240, 'Micron Technology headquarters and fab expansion.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Virginia / Data Centers
INSERT INTO public.jobsites (name, city, state, slug, lat, lng, description) VALUES
('AWS Data Center Ashburn', 'Ashburn', 'VA', 'aws-ashburn', 39.0438, -77.4874, 'Amazon Web Services data center campus.'),
('Microsoft Boydton', 'Boydton', 'VA', 'microsoft-boydton', 36.6675, -78.3872, 'Microsoft Azure data center campus.')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================
-- HUBS for TSMC Arizona
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('North Phoenix', 10, 20, 'Closest to TSMC site. Mix of apartments and newer developments.'),
  ('Deer Valley', 15, 25, 'Good access via I-17. More suburban feel.'),
  ('Glendale', 20, 35, 'Affordable options. Use Loop 101 or surface streets.'),
  ('Peoria', 25, 40, 'More space for the money. Can be traffic-heavy at shift changes.'),
  ('Scottsdale', 30, 45, 'Upscale area. Longer commute but nice amenities.'),
  ('Chandler', 35, 50, 'South Valley option. May suit those also considering Intel.'),
  ('Mesa', 35, 50, 'East Valley. Affordable but longer drive.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'tsmc-arizona'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for Intel Ocotillo (Chandler)
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('Chandler', 5, 15, 'Walk or bike to site. Best for work-life balance.'),
  ('Gilbert', 10, 20, 'Family-friendly. Good schools and amenities.'),
  ('Mesa', 15, 25, 'Affordable with good transit options.'),
  ('Tempe', 15, 30, 'College town vibe. Near ASU with younger crowd.'),
  ('Queen Creek', 20, 35, 'Newer developments. More rural feel.'),
  ('Phoenix - Ahwatukee', 20, 35, 'Mountain views. Use I-10 or surface streets.'),
  ('Scottsdale', 25, 40, 'Upscale. Traffic can be heavy on 101.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'intel-ocotillo'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for Samsung Taylor
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('Taylor', 0, 15, 'Right in town. Limited inventory but shortest commute.'),
  ('Hutto', 15, 25, 'Growing suburb. Good new construction options.'),
  ('Round Rock', 20, 35, 'Lots of amenities and dining. Use 79 or toll roads.'),
  ('Pflugerville', 20, 35, 'Affordable suburb. Similar commute to Round Rock.'),
  ('Georgetown', 30, 45, 'Historic downtown. Charming but further out.'),
  ('Austin - East', 35, 50, 'City living. Use 130 toll or 290.'),
  ('Elgin', 15, 25, 'Small town east of Taylor. Very affordable.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'samsung-taylor'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for Intel Ohio (New Albany)
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('New Albany', 5, 15, 'Upscale planned community. Closest to site.'),
  ('Johnstown', 10, 20, 'Small town with growing options.'),
  ('Westerville', 15, 30, 'Established suburb. Good schools.'),
  ('Gahanna', 15, 25, 'Near airport. Convenient location.'),
  ('Columbus - Easton', 20, 35, 'Urban living with shopping and dining.'),
  ('Columbus - Short North', 25, 40, 'Arts district. Vibrant nightlife.'),
  ('Delaware', 25, 40, 'College town. Affordable student-area housing.'),
  ('Newark', 30, 45, 'Further east. Very affordable options.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'intel-ohio'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for Micron Syracuse
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('Clay', 5, 15, 'Closest to site. Suburban neighborhood.'),
  ('Liverpool', 10, 20, 'Near Onondaga Lake. Good amenities.'),
  ('Cicero', 10, 20, 'North suburb. Mix of old and new housing.'),
  ('Syracuse - North Side', 15, 25, 'Urban option. Near downtown.'),
  ('Baldwinsville', 20, 30, 'Small town charm. Good schools.'),
  ('East Syracuse', 20, 30, 'Near airport and I-90.'),
  ('Fayetteville', 25, 40, 'Upscale suburb. Longer commute.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'micron-syracuse'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for Micron Boise
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('Boise - Downtown', 5, 15, 'Urban living. Walk or bike possible.'),
  ('Boise - Bench', 10, 20, 'South Boise. Good neighborhood feel.'),
  ('Garden City', 10, 20, 'Eclectic area. Good value.'),
  ('Meridian', 15, 30, 'Fastest growing city in Idaho. Lots of new construction.'),
  ('Eagle', 20, 35, 'Upscale suburb. Nice outdoor access.'),
  ('Nampa', 25, 40, 'Most affordable option. Growing area.'),
  ('Caldwell', 30, 45, 'Further west. Very affordable.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'micron-boise'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for AWS Ashburn
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('Ashburn', 5, 15, 'In Data Center Alley. Lots of options.'),
  ('Sterling', 10, 20, 'Adjacent to Ashburn. Good mix of housing.'),
  ('Leesburg', 15, 25, 'Historic downtown. Charming area.'),
  ('Herndon', 10, 25, 'Near Dulles. Good transit options.'),
  ('Reston', 15, 30, 'Planned community. Metro access.'),
  ('South Riding', 15, 30, 'Newer development. Family-friendly.'),
  ('Chantilly', 15, 30, 'Near airport. Good highway access.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'aws-ashburn'
ON CONFLICT DO NOTHING;

-- ============================================
-- HUBS for Tesla Gigafactory Texas
-- ============================================
INSERT INTO public.hubs (jobsite_id, name, commute_min, commute_max, description)
SELECT j.id, hub.name, hub.commute_min, hub.commute_max, hub.description
FROM public.jobsites j
CROSS JOIN (VALUES
  ('Del Valle', 5, 15, 'Closest to Giga Texas. Growing fast.'),
  ('Austin - Southeast', 10, 25, 'Urban options near 183.'),
  ('Austin - East', 15, 30, 'Trendy East Austin. Good food scene.'),
  ('Bastrop', 20, 35, 'Small town. Very affordable.'),
  ('Manor', 15, 30, 'Growing suburb. Good value.'),
  ('Pflugerville', 25, 40, 'Established suburb. More amenities.'),
  ('Kyle', 25, 40, 'South of Austin. Use 130 toll.')
) AS hub(name, commute_min, commute_max, description)
WHERE j.slug = 'tesla-gigafactory-texas'
ON CONFLICT DO NOTHING;

-- ============================================
-- Sample Listings with Photos (for demo)
-- These reference the seeded jobsites/hubs
-- ============================================

-- Note: In production, these would be created by users.
-- This is demo data to show photo-forward listing cards.

-- First, we need sample profiles (if not exists)
INSERT INTO public.profiles (user_id, display_name, city, bio)
VALUES 
  ('demo_user_1', 'Sarah M.', 'Phoenix, AZ', 'Electrician working at TSMC. Early shifts preferred.'),
  ('demo_user_2', 'Jessica R.', 'Taylor, TX', 'Welder on Samsung project. Looking for roommate.'),
  ('demo_user_3', 'Amanda K.', 'Columbus, OH', 'HVAC tech at Intel Ohio. 6-month project.'),
  ('demo_user_4', 'Michelle T.', 'Chandler, AZ', 'Project coordinator at Intel.'),
  ('demo_user_5', 'Rachel B.', 'Round Rock, TX', 'Pipefitter at Samsung Taylor.'),
  ('demo_user_6', 'Lauren W.', 'Boise, ID', 'QA tech at Micron.')
ON CONFLICT (user_id) DO NOTHING;

-- Sample listings with photo URLs (using placeholder images)
INSERT INTO public.listings (
  user_id, city, area, rent_min, rent_max, move_in, room_type, 
  commute_area, details, is_active, jobsite_id, hub_id, shift,
  cover_photo_url, photo_urls
)
SELECT 
  'demo_user_1',
  'Phoenix, AZ',
  'North Phoenix',
  850, 1000,
  CURRENT_DATE + INTERVAL '30 days',
  'private_room',
  'TSMC Arizona',
  'Clean, quiet 2BR apartment. Looking for a roommate who works similar shifts. I have the day shift at TSMC. Place has a pool and gym. Non-smoker preferred.',
  true,
  j.id,
  h.id,
  'day',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
  ]
FROM public.jobsites j
JOIN public.hubs h ON h.jobsite_id = j.id AND h.name = 'North Phoenix'
WHERE j.slug = 'tsmc-arizona'
ON CONFLICT DO NOTHING;

INSERT INTO public.listings (
  user_id, city, area, rent_min, rent_max, move_in, room_type, 
  commute_area, details, is_active, jobsite_id, hub_id, shift,
  cover_photo_url, photo_urls
)
SELECT 
  'demo_user_2',
  'Taylor, TX',
  'Hutto',
  700, 850,
  CURRENT_DATE + INTERVAL '14 days',
  'shared_room',
  'Samsung Taylor',
  'Sharing a 3BR house with one other tradeswomen. Room available is shared. We''re both on swing shift at Samsung. House has a big backyard and washer/dryer.',
  true,
  j.id,
  h.id,
  'swing',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800'
  ]
FROM public.jobsites j
JOIN public.hubs h ON h.jobsite_id = j.id AND h.name = 'Hutto'
WHERE j.slug = 'samsung-taylor'
ON CONFLICT DO NOTHING;

INSERT INTO public.listings (
  user_id, city, area, rent_min, rent_max, move_in, room_type, 
  commute_area, details, is_active, jobsite_id, hub_id, shift,
  cover_photo_url, photo_urls
)
SELECT 
  'demo_user_3',
  'New Albany, OH',
  'New Albany',
  900, 1100,
  CURRENT_DATE + INTERVAL '7 days',
  'private_room',
  'Intel Ohio',
  'Private room in a new townhouse. 10 min from the Intel site. I work nights so the place is quiet during the day. 6-month lease available.',
  true,
  j.id,
  h.id,
  'night',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800'
  ]
FROM public.jobsites j
JOIN public.hubs h ON h.jobsite_id = j.id AND h.name = 'New Albany'
WHERE j.slug = 'intel-ohio'
ON CONFLICT DO NOTHING;

INSERT INTO public.listings (
  user_id, city, area, rent_min, rent_max, move_in, room_type, 
  commute_area, details, is_active, jobsite_id, hub_id, shift,
  cover_photo_url, photo_urls
)
SELECT 
  'demo_user_4',
  'Chandler, AZ',
  'Chandler',
  1100, 1300,
  CURRENT_DATE + INTERVAL '45 days',
  'entire_place',
  'Intel Ocotillo',
  'Entire 1BR apartment available. I''m relocating for a new project. Lease takeover with option to renew. Great complex with pool, gym, and covered parking.',
  true,
  j.id,
  h.id,
  'day',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800'
  ]
FROM public.jobsites j
JOIN public.hubs h ON h.jobsite_id = j.id AND h.name = 'Chandler'
WHERE j.slug = 'intel-ocotillo'
ON CONFLICT DO NOTHING;

-- Listing without photos (to test "No photos yet" badge)
INSERT INTO public.listings (
  user_id, city, area, rent_min, rent_max, move_in, room_type, 
  commute_area, details, is_active, jobsite_id, hub_id, shift,
  cover_photo_url, photo_urls
)
SELECT 
  'demo_user_5',
  'Round Rock, TX',
  'Round Rock',
  750, 900,
  CURRENT_DATE + INTERVAL '21 days',
  'private_room',
  'Samsung Taylor',
  'Looking for a roommate for my 2BR apartment. I work day shift as a pipefitter. Place is furnished, just need to bring your stuff for your room.',
  true,
  j.id,
  h.id,
  'day',
  NULL,  -- No cover photo
  NULL   -- No photos
FROM public.jobsites j
JOIN public.hubs h ON h.jobsite_id = j.id AND h.name = 'Round Rock'
WHERE j.slug = 'samsung-taylor'
ON CONFLICT DO NOTHING;

-- Listing with only 1 photo
INSERT INTO public.listings (
  user_id, city, area, rent_min, rent_max, move_in, room_type, 
  commute_area, details, is_active, jobsite_id, hub_id, shift,
  cover_photo_url, photo_urls
)
SELECT 
  'demo_user_6',
  'Boise, ID',
  'Meridian',
  650, 800,
  CURRENT_DATE + INTERVAL '10 days',
  'shared_room',
  'Micron Boise',
  'Shared room in a 4BR house with 3 other women. We all work at Micron on different shifts. House is laid back and clean.',
  true,
  j.id,
  h.id,
  'swing',
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
  ARRAY['https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800']
FROM public.jobsites j
JOIN public.hubs h ON h.jobsite_id = j.id AND h.name = 'Meridian'
WHERE j.slug = 'micron-boise'
ON CONFLICT DO NOTHING;
