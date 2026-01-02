import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { nanoid } from 'nanoid'
import sharp from 'sharp'

// Configuration
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (before conversion)
const MAX_FILES = 6
const RATE_LIMIT_BUCKET = 'upload'
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const RATE_LIMIT_MAX = 40 // max 40 uploads per hour per IP

// WebP conversion settings for optimal quality/size balance
const WEBP_OPTIONS = {
  quality: 85,
  effort: 4, // 0-6, higher = smaller file but slower
}

// Maximum image dimensions (will resize if larger)
const MAX_IMAGE_WIDTH = 2048
const MAX_IMAGE_HEIGHT = 2048

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a server client for auth verification
async function createAuthClient(req: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll() {
        // Not setting cookies in API routes
      },
    },
  })
}

// Check and update rate limit
async function checkRateLimit(adminClient: ReturnType<typeof createAdminClient>, identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date()
  windowStart.setMinutes(0, 0, 0) // Round to hour start
  
  // Try to get existing rate limit record
  const { data: existing } = await adminClient
    .from('rate_limits')
    .select('request_count')
    .eq('bucket', RATE_LIMIT_BUCKET)
    .eq('identifier', identifier)
    .eq('window_start', windowStart.toISOString())
    .single()

  if (existing) {
    if (existing.request_count >= RATE_LIMIT_MAX) {
      return { allowed: false, remaining: 0 }
    }
    
    // Increment counter
    await adminClient
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('bucket', RATE_LIMIT_BUCKET)
      .eq('identifier', identifier)
      .eq('window_start', windowStart.toISOString())
    
    return { allowed: true, remaining: RATE_LIMIT_MAX - existing.request_count - 1 }
  }

  // Create new rate limit record
  await adminClient
    .from('rate_limits')
    .insert({
      bucket: RATE_LIMIT_BUCKET,
      identifier,
      window_start: windowStart.toISOString(),
      request_count: 1,
    })

  return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
}

/**
 * Convert image buffer to optimized WebP
 * - Resize if too large
 * - Strip metadata
 * - Convert to WebP format
 */
async function convertToWebP(buffer: ArrayBuffer): Promise<Buffer> {
  const sharpInstance = sharp(Buffer.from(buffer))
    .rotate() // Auto-rotate based on EXIF
    .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true, // Don't upscale smaller images
    })
    .webp(WEBP_OPTIONS)
  
  return sharpInstance.toBuffer()
}

/**
 * POST /api/upload
 * Upload photos to Supabase Storage
 * 
 * REQUIRES: Authenticated user
 * 
 * Request: multipart/form-data with files under field "files"
 * Response: { ok: true, paths: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    // ========================================
    // 1. AUTHENTICATION CHECK
    // ========================================
    const authClient = await createAuthClient(req)
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      console.log('[Upload] Unauthorized upload attempt')
      return NextResponse.json(
        { ok: false, error: 'You must be logged in to upload photos' },
        { status: 401 }
      )
    }

    console.log('[Upload] Authenticated user:', user.id)

    const adminClient = createAdminClient()
    
    // Rate limiting - use user ID for authenticated users
    const identifier = user.id
    const { allowed, remaining } = await checkRateLimit(adminClient, identifier)
    
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW + '',
          }
        }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const files = formData.getAll('files')

    if (!files || files.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No files provided. Use field name "files".' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { ok: false, error: `Maximum ${MAX_FILES} files allowed per upload.` },
        { status: 400 }
      )
    }

    // Generate a unique batch ID for this upload (will be used as folder name)
    // Include user ID prefix for organization and potential future security checks
    const batchId = nanoid(12)
    const uploadedPaths: string[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!(file instanceof File)) {
        errors.push('Invalid file in request')
        continue
      }

      // Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`)
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File too large: ${file.name}. Maximum size: 10MB`)
        continue
      }

      try {
        // Read file buffer
        const originalBuffer = await file.arrayBuffer()

        // Convert to optimized WebP
        console.log(`[Upload] Converting ${file.name} to WebP...`)
        const webpBuffer = await convertToWebP(originalBuffer)
        
        // Generate deterministic filename with webp extension
        // Path format: {userId}/{batchId}/img_{index}.webp
        const fileName = `img_${i}.webp`
        const storagePath = `${user.id}/${batchId}/${fileName}`

        console.log(`[Upload] Converted ${file.name}: ${file.size} -> ${webpBuffer.length} bytes (${Math.round((1 - webpBuffer.length / file.size) * 100)}% reduction)`)

        // Upload to Supabase Storage
        const { error: uploadError } = await adminClient.storage
          .from('listing-photos')
          .upload(storagePath, webpBuffer, {
            contentType: 'image/webp',
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          errors.push(`Failed to upload: ${file.name}`)
          continue
        }

        uploadedPaths.push(storagePath)
      } catch (conversionError) {
        console.error('Image conversion error:', conversionError)
        errors.push(`Failed to process: ${file.name}`)
        continue
      }
    }

    if (uploadedPaths.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No files were uploaded successfully.', details: errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        ok: true, 
        paths: uploadedPaths,
        ...(errors.length > 0 && { warnings: errors }),
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        }
      }
    )
  } catch (error) {
    console.error('Unexpected error in upload:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred during upload.' },
      { status: 500 }
    )
  }
}
