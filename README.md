# SiteSisters - Roommate Matching for Women in Construction

**Roommates who get the jobsite schedule.**

Women-first roommate matching for construction & data center projects. No public contact info. Intros by request.

## Features

- 🏠 **Browse Listings** - Filter by city, rent range, and room type
- 📝 **Post a Listing** - Share your housing availability or roommate search
- 🤝 **Request Intros** - Connect safely without exposing contact info publicly
- 🚨 **Report System** - Keep the community safe with anonymous reporting

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS-in-JS (inline styles)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

See `database/schema.sql` for the complete database structure including:
- `profiles` - User profiles
- `listings` - Roommate listings
- `intro_requests` - Introduction requests between users
- `reports` - Moderation reports

## Routes

- `/` - Redirects to `/design`
- `/design` - Main SiteSisters marketplace UI with filters, listings grid, and detail drawer

---

Built for women who build. 🏗️
