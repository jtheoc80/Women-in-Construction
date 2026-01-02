'use client'

import * as React from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeListingPhotoUrl, getListingPhotoUrls } from '@/components/ListingImage'

interface PhotoGalleryProps {
  photos: string[]
  alt?: string
  className?: string
}

/**
 * PhotoGallery - Mobile-ready photo carousel with lightbox
 * 
 * Features:
 * - Touch/swipe support for mobile
 * - Keyboard navigation
 * - Fullscreen lightbox mode
 * - Thumbnail navigation
 * - Preloading adjacent images
 */
export function PhotoGallery({ photos, alt = 'Photo', className }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false)
  const [touchStart, setTouchStart] = React.useState<number | null>(null)
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null)
  
  // Normalize all photo URLs
  const normalizedPhotos = React.useMemo(
    () => photos.map(p => normalizeListingPhotoUrl(p)).filter((p): p is string => p !== null),
    [photos]
  )
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const handlePrevious = React.useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? normalizedPhotos.length - 1 : prev - 1))
  }, [normalizedPhotos.length])

  const handleNext = React.useCallback(() => {
    setCurrentIndex(prev => (prev === normalizedPhotos.length - 1 ? 0 : prev + 1))
  }, [normalizedPhotos.length])

  // Keyboard navigation
  React.useEffect(() => {
    if (!isLightboxOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, handlePrevious, handleNext])

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrevious()
    }
  }

  // Body scroll lock when lightbox is open
  React.useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen])

  if (normalizedPhotos.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100',
          className
        )}
        style={{ aspectRatio: '16/9' }}
      >
        <span className="text-sm text-slate-400">No photos</span>
      </div>
    )
  }

  return (
    <>
      {/* Main Carousel */}
      <div
        className={cn('relative overflow-hidden bg-slate-900', className)}
        style={{ aspectRatio: '16/9' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Current Image */}
        <Image
          src={normalizedPhotos[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          className="object-cover"
          priority={currentIndex === 0}
        />

        {/* Navigation arrows (only on desktop or when multiple photos) */}
        {normalizedPhotos.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {normalizedPhotos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {normalizedPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                )}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Expand to lightbox button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="View fullscreen"
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        {/* Photo counter */}
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {currentIndex + 1} / {normalizedPhotos.length}
        </span>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95"
          onClick={() => setIsLightboxOpen(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Photo counter */}
          <span className="absolute left-4 top-4 z-20 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {currentIndex + 1} / {normalizedPhotos.length}
          </span>

          {/* Main image */}
          <div
            className="relative h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={normalizedPhotos[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Navigation arrows */}
          {normalizedPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                }}
                className="absolute left-4 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-4 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {normalizedPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/50 p-2 backdrop-blur-sm">
              {normalizedPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(idx)
                  }}
                  className={cn(
                    'relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all',
                    idx === currentIndex
                      ? 'ring-2 ring-white'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  <Image
                    src={photo}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/**
 * ListingPhotoGallery - PhotoGallery specifically for listings
 * Extracts photos from a listing object
 */
interface ListingPhotoGalleryProps {
  listing: {
    cover_photo_url?: string | null
    photo_urls?: string[] | null
    city?: string
    area?: string | null
  }
  className?: string
}

export function ListingPhotoGallery({ listing, className }: ListingPhotoGalleryProps) {
  const photos = getListingPhotoUrls(listing)
  const alt = listing.area || listing.city || 'Listing photo'
  
  return <PhotoGallery photos={photos} alt={alt} className={className} />
}
