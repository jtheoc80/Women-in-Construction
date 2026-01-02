'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { useGatedAction } from '@/contexts/AuthContext'
import { PostListingModal } from '@/components/PostListingModal'
import { ListingCardImage } from '@/components/ListingImage'
import { MapPin, Target, Loader2 } from 'lucide-react'

interface PosterProfile {
  id: string
  display_name: string
  company: string
  role: string | null
}

interface Listing {
  id: string
  user_id: string
  poster_profile_id: string | null
  title: string | null
  city: string
  area: string | null
  rent_min: number | null
  rent_max: number | null
  move_in: string | null
  room_type: string
  commute_area: string | null
  details: string | null
  tags: string[] | null
  place_id: string | null
  lat: number | null
  lng: number | null
  is_active: boolean
  created_at: string
  full_address?: string | null
  is_owner?: boolean
  poster_profiles?: PosterProfile | null
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  profiles?: { display_name: string }
}

function getDisplayName(listing: Listing): string {
  return listing.poster_profiles?.display_name || listing.profiles?.display_name || 'Anonymous'
}

function getCompany(listing: Listing): string | null {
  return listing.poster_profiles?.company || null
}

function formatRoomType(type: string): string {
  switch (type) {
    case 'private_room': return 'Private Room'
    case 'shared_room': return 'Shared Room'
    case 'entire_place': return 'Entire Place'
    default: return type
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Flexible'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function HomeClient() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
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
      const data = await response.json()
      setListings(Array.isArray(data) ? data : [])
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
          {loading ? 'Loading listings...' : error ? 'Listings unavailable' : `${listings.length} Listings Available`}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-800">Couldn’t load listings</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadListings}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>No listings yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Photo with 16:9 aspect ratio */}
                <div className="relative">
                  <ListingCardImage
                    listing={listing}
                    priority={index < 6}
                    className="bg-slate-100"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {formatRoomType(listing.room_type)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{listing.city}</h3>
                  {listing.area && (
                    <p className="mt-0.5 text-sm text-slate-500">{listing.area}</p>
                  )}
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    ${listing.rent_min || '?'} - ${listing.rent_max || '?'}
                    <span className="text-sm font-normal">/mo</span>
                  </p>
                  {listing.commute_area && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      Near {listing.commute_area}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Move-in: {formatDate(listing.move_in)}
                  </p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">
                      Posted by {getDisplayName(listing)}
                      {getCompany(listing) && (
                        <span className="text-slate-500"> • {getCompany(listing)}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
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
