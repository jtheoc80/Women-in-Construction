import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { nanoid } from 'nanoid'

// Configuration
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 6 * 1024 * 1024 // 6MB
const MAX_FILES = 6
const RATE_LIMIT_BUCKET = 'upload'
const RATE_LIMIT_WINDOW = 3600 // 1 hour in seconds
const RATE_LIMIT_MAX = 40 // max 40 uploads per hour per IP

// Get client IP from request
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
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

// Get file extension from mime type
function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

/**
 * POST /api/upload
 * Upload photos to Supabase Storage
 * 
 * Request: multipart/form-data with files under field "files"
 * Response: { ok: true, paths: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const adminClient = createAdminClient()
    
    // Rate limiting
    const clientIP = getClientIP(req)
    const { allowed, remaining } = await checkRateLimit(adminClient, clientIP)
    
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

    // Generate a unique listing ID for this batch (will be used as folder name)
    const listingId = nanoid(12)
    const uploadedPaths: string[] = []
    const errors: string[] = []

    for (const file of files) {
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
        errors.push(`File too large: ${file.name}. Maximum size: 6MB`)
        continue
      }

      // Generate unique filename
      const ext = getExtension(file.type)
      const fileName = `${nanoid(16)}.${ext}`
      const storagePath = `${listingId}/${fileName}`

      // Read file buffer
      const buffer = await file.arrayBuffer()

      // Upload to Supabase Storage
      const { error: uploadError } = await adminClient.storage
        .from('listing-photos')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        errors.push(`Failed to upload: ${file.name}`)
        continue
      }

      uploadedPaths.push(storagePath)
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
