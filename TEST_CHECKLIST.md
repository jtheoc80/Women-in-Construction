# Test Checklist for Auth/Listings/Upload Fixes

## Prerequisites
- Ensure Supabase project has the migration `008_listings_rls_anon.sql` applied
- Ensure Supabase Auth redirect URLs include both domains (see Supabase Dashboard steps below)

## 1. Anonymous Access Tests

### 1.1 GET /api/listings (Public)
```bash
# Should return 200 with JSON array (can be empty)
curl -s https://sitesistersconstruction.com/api/listings | head -100
curl -s https://women-in-construction.vercel.app/api/listings | head -100
```
Expected: HTTP 200, JSON array of listings

### 1.2 Home Page Browse
1. Open https://sitesistersconstruction.com in incognito browser
2. Scroll to listings section
3. Should see listing cards (or "No listings yet" message)
4. No "Failed to fetch listings" error

### 1.3 /browse and /jobsites
1. Navigate to /browse (redirects to /jobsites)
2. Navigate to /jobsites
3. Both should load without auth requirement

## 2. Authentication Tests

### 2.1 Sign Up (New User)
1. Go to /signup
2. Enter email and password
3. Submit - should receive verification email
4. Click verification link
5. Should redirect to /browse (or ?next param)

### 2.2 Sign In (Existing User)
1. Go to /sign-in
2. Enter credentials
3. Submit - should redirect to /browse

### 2.3 Magic Link Flow
1. Go to /sign-in
2. Switch to "Sign in with magic link"
3. Enter email
4. Submit - should receive email
5. Click link - should authenticate and redirect

## 3. Protected Routes

### 3.1 Unauthenticated Access
1. Sign out (if signed in)
2. Try to access /account - should redirect to /signup
3. Try to access /inbox - should redirect to /signup
4. Try to access /design - should redirect to /signup

### 3.2 Authenticated Access
1. Sign in
2. Access /account - should load
3. Access /inbox - should load

## 4. Listing Creation (Authenticated)

### 4.1 Post Listing Modal
1. Sign in
2. Click "Post Listing" button on home page
3. Fill out all steps:
   - About You (name, company)
   - Location (city)
   - Details (room type)
   - Photos (upload 1-3 images)
   - Contact (email)
4. Submit
5. Should succeed and show new listing

### 4.2 POST /api/listings (Unauthenticated - Should Fail)
```bash
curl -X POST https://sitesistersconstruction.com/api/listings \
  -H "Content-Type: application/json" \
  -d '{"profile":{"displayName":"Test","company":"Test","contactPreference":"email","contactValue":"test@test.com"},"listing":{"city":"Test","roomType":"private_room"}}'
```
Expected: HTTP 401, "You must be logged in to post a listing"

## 5. Image Upload (Authenticated)

### 5.1 Unauthenticated Upload (Should Fail)
```bash
curl -X POST https://sitesistersconstruction.com/api/upload \
  -F "files=@/path/to/image.jpg"
```
Expected: HTTP 401, "You must be logged in to upload photos"

### 5.2 Authenticated Upload
1. Sign in
2. Use Post Listing modal
3. Upload photos
4. Photos should appear in preview
5. After posting, photos should display on listing card

## 6. Cross-Domain Tests

### 6.1 Custom Domain
- All above tests on https://sitesistersconstruction.com

### 6.2 Vercel Domain
- All above tests on https://women-in-construction.vercel.app

### 6.3 Auth Callbacks
- Sign up/in on custom domain - callback should stay on custom domain
- Sign up/in on vercel domain - callback should stay on vercel domain

## 7. Image Display

### 7.1 Public Images
1. Post a listing with photos (while authenticated)
2. Sign out
3. Visit home page
4. Listing card should show cover photo
5. Image URL should be publicly accessible

---

## Supabase Dashboard Changes Required

### Auth Redirect URLs
Go to: Supabase Dashboard > Authentication > URL Configuration

Add these to "Redirect URLs":
```
https://sitesistersconstruction.com/**
https://www.sitesistersconstruction.com/**
https://women-in-construction.vercel.app/**
http://localhost:3000/**
```

### Storage Bucket (listing-photos)
1. Go to: Supabase Dashboard > Storage
2. Ensure bucket `listing-photos` exists
3. Make it public:
   - Click on bucket settings
   - Toggle "Public bucket" to ON
   - Or add policy for public read access

### Run Migration
Apply the new RLS migration:
```sql
-- Run database/migrations/008_listings_rls_anon.sql
-- in the Supabase SQL Editor
```

---

## Expected Results After Fixes

| Test | Before Fix | After Fix |
|------|-----------|-----------|
| Anonymous GET /api/listings | May fail | 200 + JSON |
| Anonymous browse listings | "Failed to fetch" | Shows listings |
| Unauthenticated upload | 200 (allowed!) | 401 (blocked) |
| Auth on custom domain | May fail callback | Works |
| Image display | May fail | Public URLs work |
