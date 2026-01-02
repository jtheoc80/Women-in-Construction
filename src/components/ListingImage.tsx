'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

/**
 * Normalizes a listing photo URL or storage path to a full public URL
 */
export function normalizeListingPhotoUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null
  const val = urlOrPath.trim()
  if (!val) return null
  // Already a full URL
  if (val.startsWith('http://') || val.startsWith('https://')) return val
  // Local path (e.g. /demo/...)
  if (val.startsWith('/')) return val
  // Storage path - convert to public URL
  if (!SUPABASE_URL) return null
  return `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${val}`
}

/**
 * Get the hero image URL for a listing
 */
export function getListingHeroImageUrl(listing: {
  cover_photo_url?: string | null
  photo_urls?: string[] | null
}): string | null {
  return (
    normalizeListingPhotoUrl(listing.cover_photo_url) ??
    normalizeListingPhotoUrl(listing.photo_urls?.[0]) ??
    null
  )
}

/**
 * Get all photo URLs for a listing
 */
export function getListingPhotoUrls(listing: {
  cover_photo_url?: string | null
  photo_urls?: string[] | null
}): string[] {
  const urls = [
    normalizeListingPhotoUrl(listing.cover_photo_url),
    ...(listing.photo_urls || []).map(normalizeListingPhotoUrl),
  ].filter((x): x is string => Boolean(x))
  return Array.from(new Set(urls))
}

interface ListingImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
  aspectRatio?: '16/9' | '4/3' | '1/1'
  fill?: boolean
}

/**
 * ListingImage - Optimized image component for listing photos
 * 
 * Features:
 * - Uses next/image for optimization
 * - Consistent 16:9 aspect ratio by default
 * - Graceful error handling with fallback
 * - Loading placeholder
 * - Mobile-ready with responsive sizing
 */
export function ListingImage({
  src,
  alt,
  className,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  aspectRatio = '16/9',
  fill = false,
}: ListingImageProps) {
  const [hasError, setHasError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false)
    setIsLoading(true)
  }, [src])

  const normalizedSrc = src ? normalizeListingPhotoUrl(src) : null

  // Show placeholder if no src or error
  if (!normalizedSrc || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100',
          fill ? 'absolute inset-0' : '',
          className
        )}
        style={fill ? undefined : { aspectRatio }}
      >
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <ImageOff className="h-8 w-8" />
          <span className="text-xs font-medium">No photo</span>
        </div>
      </div>
    )
  }

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}
        <Image
          src={normalizedSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true)
            setIsLoading(false)
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}

interface ListingCardImageProps {
  listing: {
    cover_photo_url?: string | null
    photo_urls?: string[] | null
    city?: string
    area?: string | null
  }
  className?: string
  priority?: boolean
}

/**
 * ListingCardImage - Image component specifically for listing cards
 * Uses 16:9 aspect ratio and shows photo count badge if multiple photos
 */
export function ListingCardImage({
  listing,
  className,
  priority = false,
}: ListingCardImageProps) {
  const heroUrl = getListingHeroImageUrl(listing)
  const photoCount = getListingPhotoUrls(listing).length

  return (
    <div className={cn('relative', className)}>
      <ListingImage
        src={heroUrl}
        alt={listing.area || listing.city || 'Listing photo'}
        priority={priority}
        aspectRatio="16/9"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {photoCount > 1 && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {photoCount}
        </span>
      )}
    </div>
  )
}

/**
 * PhotoPlaceholder - Placeholder shown when no image is available
 * Dark themed for use in dark UI contexts
 */
export function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600',
        className
      )}
    >
      <span className="text-sm font-medium text-white/70">Photo coming soon</span>
    </div>
  )
}
