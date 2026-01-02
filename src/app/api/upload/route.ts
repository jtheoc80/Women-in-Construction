import { createServerClient } from '@supabase/ssr'
import { nanoid } from 'nanoid'
import { NextRequest, NextResponse } from 'next/server'

// Configuration
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 6 * 1024 * 1024 // 6MB
const MAX_FILES = 6

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function requireEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: string | undefined) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function createRouteClient(req: NextRequest) {
  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {
          // Route handlers don't need to set auth cookies for this endpoint.
        },
      },
    }
  )
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
    const supabase = createRouteClient(req)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
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
      // Store under user-id prefix so storage policies can be scoped to auth.uid()
      const storagePath = `${user.id}/${listingId}/${fileName}`

      // Read file buffer
      const buffer = await file.arrayBuffer()

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
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
