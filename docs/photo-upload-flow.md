# Photo Upload Flow

## Overview

This document explains how photo uploads work in the Women in Construction platform and how photos are tracked and associated with listings.

## The Problem

Previously, the photo upload endpoint generated a unique folder name for each upload batch, but this folder name was not returned to the client or tracked anywhere. When photos were uploaded before the listing was created, the folder name in storage didn't match the actual listing ID from the database, creating orphaned photos that weren't properly associated with any listing.

## The Solution

### Upload Batch ID Tracking

The `/api/upload` endpoint now returns an `uploadBatchId` along with the photo paths. This batch ID serves as:
1. A unique identifier for the upload batch
2. The folder name where photos are stored in Supabase Storage
3. A tracking mechanism that connects uploaded photos to their eventual listing

### How It Works

1. **Photo Upload** (`POST /api/upload`)
   - User uploads photos through the UI
   - Server generates a unique `uploadBatchId` (12-character nanoid)
   - Photos are stored in storage at path: `{uploadBatchId}/{filename}`
   - Server returns:
     ```json
     {
       "ok": true,
       "uploadBatchId": "abc123xyz789",
       "paths": [
         "abc123xyz789/photo1.jpg",
         "abc123xyz789/photo2.jpg"
       ]
     }
     ```

2. **Listing Creation** (`POST /api/listings`)
   - User fills out listing form with profile and listing details
   - Client sends photo paths (from upload response) in the request
   - Server creates:
     - Poster profile record
     - Profile contact record (private)
     - Listing record (gets a database-generated UUID)
     - Listing photo records (one per path)
   - Each photo record stores:
     - `listing_id`: The database UUID of the listing
     - `storage_path`: The original path from upload (contains the batch ID)
     - `sort_order`: Order for displaying photos

3. **Photo Display**
   - When fetching listings, the database returns photo records with their `storage_path`
   - Frontend constructs public URLs using: `{SUPABASE_URL}/storage/v1/object/public/listing-photos/{storage_path}`
   - Photos display correctly because the storage path correctly points to where they were uploaded

## Key Points

- **Folder names don't need to match listing IDs**: The upload batch ID serves as the folder name, and that's fine. The database tracks the association between listing IDs and photo storage paths.
- **No file moving required**: Photos stay in their original upload location. The database creates the linkage.
- **Clean separation**: Upload and listing creation are separate operations, allowing users to upload photos at any time during the form-filling process.

## Example Flow

```
User uploads 2 photos
  → POST /api/upload with files
  → Server generates uploadBatchId: "xK3mN9pQ2wVz"
  → Photos stored as:
      - xK3mN9pQ2wVz/aB1cD2eF3gH4iJ5k.jpg
      - xK3mN9pQ2wVz/lM6nO7pQ8rS9tU0v.jpg
  → Response: { uploadBatchId: "xK3mN9pQ2wVz", paths: [...] }

User completes form and submits
  → POST /api/listings with profile, listing, and photoPaths
  → Server creates listing with id: "550e8400-e29b-41d4-a716-446655440000"
  → Server creates photo records:
      - listing_id: "550e8400-e29b-41d4-a716-446655440000"
        storage_path: "xK3mN9pQ2wVz/aB1cD2eF3gH4iJ5k.jpg"
        sort_order: 0
      - listing_id: "550e8400-e29b-41d4-a716-446655440000"
        storage_path: "xK3mN9pQ2wVz/lM6nO7pQ8rS9tU0v.jpg"
        sort_order: 1

User views listing
  → Fetch listing with photos from database
  → Database returns storage_path values
  → Frontend constructs URLs and displays photos correctly
```

## Future Enhancements

While the current solution works well, potential future improvements could include:

1. **Cleanup of orphaned uploads**: If a user uploads photos but never completes the listing, those photos remain in storage. A cleanup job could periodically remove photos from batches that were never associated with a listing.

2. **Batch expiration**: Store upload batch metadata with timestamps, and expire batches after a certain time (e.g., 24 hours).

3. **Pre-signed upload URLs**: For better security, generate pre-signed URLs for uploads rather than accepting files directly through the API.

4. **Image optimization**: Automatically generate thumbnails and optimized versions of uploaded photos.
