# SiteSisters - Roommate Matching for Women in Construction

**Roommates who get the jobsite schedule.**

Women-first roommate matching for construction & data center projects. No public contact info. Intros by request.

## Features

- 🏠 **Browse Listings** - Filter by city, rent range, and room type
- 📝 **Post a Listing** - Share your housing availability or roommate search
- 📸 **Photo Uploads** - Add up to 6 photos to your listing
- 📍 **Address Autocomplete** - Powered by Google Places for easy location entry
- 👤 **Poster Profiles** - Display company and role info on listing cards
- 🤝 **Request Intros** - Connect safely without exposing contact info publicly
- 🚨 **Report System** - Keep the community safe with anonymous reporting

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for listing photos)
- **Maps**: Google Places API (for address autocomplete)
- **Styling**: CSS-in-JS (inline styles)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file with the following variables:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only, never expose!

# Google Maps API (required for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Set up Supabase Storage

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New bucket**
4. Create a bucket named `listing-photos`
5. Set the bucket to **Public** (for MVP - photos are publicly viewable)
6. Optionally, configure allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### 4. Run database migrations

Run the SQL migrations in order from `database/migrations/`:

```sql
-- In your Supabase SQL editor, run:
-- 001_jobsite_housing_explorer.sql
-- 002_auth_profiles.sql
-- 003_profiles_rls_trigger.sql
-- 004_in_app_messaging.sql
-- 005_invites.sql
-- 006_listing_photos_profiles.sql  -- NEW: Photos + poster profiles
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

### Public Tables (readable by anyone)

| Table | Description |
|-------|-------------|
| `poster_profiles` | Public profile info for listing posters (name, company, role) |
| `listings` | Roommate listings with location, rent, room type, etc. |
| `listing_photos` | Photos for listings, stored in Supabase Storage |

### Private Tables (service role only)

| Table | Description |
|-------|-------------|
| `profile_contacts` | Contact info (email/phone/etc.) - only shared after intro acceptance |
| `rate_limits` | API rate limiting records |

See `database/schema.sql` for the complete database structure.

## Security Model

### Public vs Private Data

- **Public (viewable by anyone)**:
  - Listing details (city, rent, room type, etc.)
  - Poster profile (display name, company, role)
  - Listing photos
  
- **Private (never exposed publicly)**:
  - Contact information (email, phone, Instagram)
  - Only shared when both parties accept an intro request

### RLS (Row Level Security)

- `anon` role can only **SELECT** from public tables
- All **INSERT/UPDATE/DELETE** operations go through API routes using the service role key
- `profile_contacts` and `rate_limits` have no anon access

### API Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/upload` | 40 requests | 1 hour |
| `/api/listings` | 5 requests | 1 hour |

## API Routes

### POST /api/upload

Upload photos to Supabase Storage.

**Request**: `multipart/form-data` with files under field `files`

**Response**:
```json
{
  "ok": true,
  "paths": ["abc123/photo1.jpg", "abc123/photo2.jpg"]
}
```

**Limits**:
- Max 6 files per request
- Max 6MB per file
- Allowed types: `image/jpeg`, `image/png`, `image/webp`

### POST /api/listings

Create a new listing with profile and contact info.

**Request**:
```json
{
  "profile": {
    "displayName": "Sarah M.",
    "company": "Turner Construction",
    "role": "Electrician",
    "contactPreference": "email",
    "contactValue": "sarah@example.com"
  },
  "listing": {
    "title": "Cozy room near Intel",
    "city": "Phoenix, AZ",
    "area": "Chandler",
    "rentMin": 800,
    "rentMax": 1000,
    "moveInISO": "2026-02-01",
    "roomType": "private_room",
    "commuteArea": "Intel Ocotillo",
    "tags": ["quiet", "non-smoker"],
    "bio": "Looking for a clean roommate...",
    "placeId": "ChIJ...",
    "lat": 33.4484,
    "lng": -112.0740
  },
  "photoPaths": ["abc123/photo1.jpg"]
}
```

**Response**:
```json
{
  "ok": true,
  "id": "uuid-of-listing"
}
```

## Google Places Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** and **Maps JavaScript API**
4. Create an API key under **Credentials**
5. (Recommended) Restrict the API key to your domain and specific APIs
6. Add the key to your `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Routes

- `/` - Redirects to `/design`
- `/design` - Main SiteSisters marketplace UI with filters, listings grid, and detail drawer
- `/jobsites` - Browse jobsites and plan your move

---

Built for women who build. 🏗️
