'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { useGatedAction } from '@/contexts/AuthContext'
import { PostListingModal } from '@/components/PostListingModal'
import { ListingCardImage } from '@/components/ListingImage'
import { MapPin, Target, Loader2 } from 'lucide-react'
import { normalizeListings, type ListingCardModel, type RawListing } from '@/lib/listings/normalize'

export default function HomeClient() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingCardModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { gateAction } = useGatedAction()
  const [showPostModal, setShowPostModal] = useState(false)

  const loadListings = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await fetch('/api/listings')
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || `Request failed (${response.status})`)
      }
      const data: RawListing[] = await response.json()
      // Normalize all listings to consistent shape
      const normalized = normalizeListings(Array.isArray(data) ? data : [])
      setListings(normalized)
    } catch (error) {
      console.error('Error loading listings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadListings()
  }, [loadListings])

  function handlePostListingClick() {
    gateAction(() => {
      setShowPostModal(true)
    }, '/')
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Navbar onPostListing={handlePostListingClick} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 pb-8 pt-10 text-center sm:pb-12 sm:pt-12">
        <h1 className="mx-auto max-w-lg text-2xl font-bold leading-tight text-white sm:max-w-2xl sm:text-4xl">
          A housing network for women who build.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/80 sm:mt-4 sm:max-w-xl sm:text-lg">
          Find roommates near construction and data center jobsites.
        </p>

        <p className="mt-4 text-xs text-white/50 sm:text-sm">
          Private by default • Request-to-connect • Report + moderation
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          <button
            onClick={() => router.push('/jobsites')}
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-500 sm:w-auto"
          >
            <Target className="h-4 w-4" />
            Plan my move
          </button>
          <a
            href="#listings"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
          >
            <MapPin className="h-4 w-4" />
            Browse listings
          </a>
        </div>
      </section>

      {/* Listings Grid */}
      <section id="listings" className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 sm:mb-6 sm:text-xl">
          {loading ? 'Loading listings...' : `${listings.length} Listings Available`}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : error || listings.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>No listings yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.rawId}`}
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {/* Photo with 16:9 aspect ratio */}
                <div className="relative">
                  <ListingCardImage
                    coverPhotoUrl={listing.coverPhotoUrl}
                    photoCount={listing.photoCount}
                    alt={listing.subLocation || listing.titleCity}
                    priority={index < 6}
                    className="bg-slate-100 transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {listing.roomType}
                  </span>
                  {listing.isDemo && (
                    <span className="absolute right-3 top-3 rounded-full bg-amber-100/95 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
                      Demo
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 relative bg-white">
                  <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {listing.titleCity}
                  </h3>
                  {listing.subLocation && (
                    <p className="mt-0.5 text-sm text-slate-500">{listing.subLocation}</p>
                  )}
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {listing.priceText}
                  </p>
                  {listing.nearText && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {listing.nearText}
                    </p>
                  )}
                  {listing.moveInText && (
                    <p className="mt-1 text-xs text-slate-400">
                      {listing.moveInText}
                    </p>
                  )}
                  {listing.postedByText && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-400">
                        Posted by {listing.postedByText}
                        {listing.companyText && (
                          <span className="text-slate-500"> • {listing.companyText}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-4 py-8 text-center">
        <p className="text-sm text-slate-400">© 2026 SiteSisters. All rights reserved.</p>
        <p className="mt-2 text-xs italic text-slate-500">Built for women who build.</p>
      </footer>

      {/* Post Listing Modal */}
      <PostListingModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={() => {
          // Reload listings after successful post
          window.location.reload()
        }}
      />
    </div>
  )
}
