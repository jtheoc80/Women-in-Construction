'use client'

import { useState, useEffect } from 'react'
import { SiteLogo } from '@/components/SiteLogo'
import { Button } from '@/components/ui/button'
import { ProfilePill } from '@/components/ProfilePill'
import { BottomSheet, SlideOver } from '@/components/BottomSheet'
import { PostListingModal } from '@/components/PostListingModal'
import {
  ListingCardImage,
  ListingImage,
  getListingPhotoUrls,
} from '@/components/ListingImage'
import { MapPin, Target, ChevronLeft, ChevronRight, Filter, Loader2, Building2, Lock } from 'lucide-react'
import { useGatedAction, useAuth } from '@/contexts/AuthContext'

// Types
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

// Supabase client constants
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

async function fetchListings(filters: {
  city?: string
  rentMax?: number
  roomType?: string
}): Promise<Listing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return getMockListings()
  }

  let url = `${SUPABASE_URL}/rest/v1/listings?select=*,poster_profiles!poster_profile_id(*)&is_active=eq.true&order=created_at.desc`
  
  if (filters.city) {
    url += `&city=ilike.*${filters.city}*`
  }
  if (filters.rentMax) {
    url += `&rent_min=lte.${filters.rentMax}`
  }
  if (filters.roomType && filters.roomType !== 'all') {
    url += `&room_type=eq.${filters.roomType}`
  }

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (!res.ok) throw new Error('Failed to fetch')
    return await res.json()
  } catch {
    return getMockListings()
  }
}

function getMockListings(): Listing[] {
  return [
    {
      id: '1', user_id: 'user1', poster_profile_id: 'profile1',
      title: 'Cozy room near Intel Ocotillo', city: 'Phoenix, AZ', area: 'Downtown',
      rent_min: 800, rent_max: 1000, move_in: '2026-02-01', room_type: 'private_room',
      commute_area: 'Intel Ocotillo', details: 'Looking for a clean, quiet roommate.',
      tags: ['quiet', 'early-riser'], place_id: null, lat: null, lng: null,
      is_active: true, created_at: '2026-01-15T10:00:00Z',
      poster_profiles: { id: 'profile1', display_name: 'Sarah M.', company: 'Turner Construction', role: 'Electrician' },
      cover_photo_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    },
    {
      id: '2', user_id: 'user2', poster_profile_id: 'profile2',
      title: 'Shared space near Samsung Taylor', city: 'Austin, TX', area: 'Round Rock',
      rent_min: 700, rent_max: 900, move_in: '2026-01-20', room_type: 'shared_room',
      commute_area: 'Samsung Taylor', details: 'Friendly electrician looking to share.',
      tags: ['friendly', 'flexible'], place_id: null, lat: null, lng: null,
      is_active: true, created_at: '2026-01-14T15:30:00Z',
      poster_profiles: { id: 'profile2', display_name: 'Jessica R.', company: 'Skanska', role: 'Project Manager' },
      cover_photo_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    },
    {
      id: '3', user_id: 'user3', poster_profile_id: 'profile3',
      title: 'Private room in New Albany', city: 'Columbus, OH', area: 'New Albany',
      rent_min: 650, rent_max: 850, move_in: '2026-02-15', room_type: 'private_room',
      commute_area: 'Intel Ohio', details: 'HVAC tech on a 6-month project.',
      tags: ['short-term', 'flexible-hours'], place_id: null, lat: null, lng: null,
      is_active: true, created_at: '2026-01-13T09:00:00Z',
      poster_profiles: { id: 'profile3', display_name: 'Amanda K.', company: 'Mortenson', role: 'HVAC Tech' },
      cover_photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    },
  ]
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

// Photo Carousel Component with next/image
function PhotoCarousel({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div className="flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-700" style={{ aspectRatio: '16/9' }}>
        <span className="text-sm font-medium text-white/70">Photo coming soon</span>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-800" style={{ aspectRatio: '16/9' }}>
      <ListingImage
        src={photos[currentIndex]}
        alt={`Photo ${currentIndex + 1}`}
        fill
        className="absolute inset-0"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5 text-slate-800" />
          </button>
          <button
            onClick={() => setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5 text-slate-800" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 w-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function DesignClient() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  
  // Auth
  const { user } = useAuth()
  const { gateAction } = useGatedAction()
  
  // Filters
  const [cityFilter, setCityFilter] = useState('')
  const [rentMaxFilter, setRentMaxFilter] = useState<number | ''>('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modals
  const [showPostModal, setShowPostModal] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // Form states
  const [introMessage, setIntroMessage] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')

  useEffect(() => {
    loadListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadListings() {
    setLoading(true)
    const data = await fetchListings({
      city: cityFilter || undefined,
      rentMax: rentMaxFilter || undefined,
      roomType: roomTypeFilter,
    })
    setListings(data)
    setLoading(false)
  }

  function handleSearch() {
    loadListings()
    setShowFilters(false)
  }

  function handlePostListingClick() {
    gateAction(() => {
      setShowPostModal(true)
    }, '/design')
  }

  function handleRequestIntro(e: React.FormEvent) {
    e.preventDefault()
    alert('Request sent! The listing owner will receive your message. (Demo mode)')
    setShowIntroModal(false)
    setIntroMessage('')
  }

  function handleReport(e: React.FormEvent) {
    e.preventDefault()
    alert('Report submitted. Thank you for helping keep our community safe. (Demo mode)')
    setShowReportModal(false)
    setReportReason('')
    setReportDetails('')
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Header - Sticky with backdrop blur */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-lg sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/browse" className="flex items-center gap-2">
            <SiteLogo />
            <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              SiteSisters
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={handlePostListingClick}
              className="h-11 bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-500 sm:px-5 sm:text-base"
            >
              <span className="hidden sm:inline">+ Post Listing</span>
              <span className="sm:hidden">+ Post</span>
            </Button>
            
            <ProfilePill />
          </div>
        </div>
      </header>

      {/* Dev mode banner */}
      <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
        🛠️ Design Preview (Development Only) — This page is not accessible in production
      </div>

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
          <a 
            href="/jobsites" 
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-500 sm:w-auto"
          >
            <Target className="h-4 w-4" />
            Plan my move
          </a>
          <a 
            href="#listings" 
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
          >
            <MapPin className="h-4 w-4" />
            Browse listings
          </a>
        </div>
      </section>

      {/* Filter Bar - Desktop inline, Mobile as button */}
      <section className="border-b border-slate-200 bg-white px-4 py-4 sm:py-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between sm:hidden">
            <h2 className="text-lg font-semibold text-slate-900">Find a place</h2>
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              className="h-11 gap-2 border-slate-300"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Desktop filters */}
          <div className="hidden gap-4 sm:flex sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">City / Region</label>
              <input
                type="text"
                placeholder="e.g. Phoenix, Austin, Columbus..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Max Rent</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={rentMaxFilter}
                onChange={(e) => setRentMaxFilter(e.target.value ? parseInt(e.target.value) : '')}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="w-44">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Room Type</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">All Types</option>
                <option value="private_room">Private Room</option>
                <option value="shared_room">Shared Room</option>
                <option value="entire_place">Entire Place</option>
              </select>
            </div>
            <Button
              onClick={handleSearch}
              className="h-11 bg-teal-600 px-6 font-semibold text-white hover:bg-teal-500"
            >
              Search
            </Button>
          </div>
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
        ) : listings.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>No listings match your filters. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <div
                key={listing.id}
                onClick={() => setSelectedListing(listing)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Photo with 16:9 aspect ratio */}
                <div className="relative">
                  <ListingCardImage
                    listing={listing}
                    priority={index < 6}
                    className="bg-slate-100"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm z-10">
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
                    ${listing.rent_min || '?'} - ${listing.rent_max || '?'}<span className="text-sm font-normal">/mo</span>
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
                      {getCompany(listing) && <span className="text-slate-500"> • {getCompany(listing)}</span>}
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

      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <div className="space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">City / Region</label>
            <input
              type="text"
              placeholder="e.g. Phoenix, Austin, Columbus..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Max Rent</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={rentMaxFilter}
              onChange={(e) => setRentMaxFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Room Type</label>
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="private_room">Private Room</option>
              <option value="shared_room">Shared Room</option>
              <option value="entire_place">Entire Place</option>
            </select>
          </div>
          <Button
            onClick={handleSearch}
            className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500"
          >
            Apply Filters
          </Button>
        </div>
      </BottomSheet>

      {/* Listing Detail - Bottom sheet on mobile, slide-over on desktop */}
      <SlideOver
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title={selectedListing?.title || selectedListing?.city || 'Listing'}
      >
        {selectedListing && (
          <div className="p-4 sm:p-6">
            <PhotoCarousel photos={getListingPhotoUrls(selectedListing)} />

            <h2 className="mt-4 text-xl font-bold text-white sm:text-2xl">
              {selectedListing.title || selectedListing.city}
            </h2>
            {selectedListing.area && (
              <p className="mt-1 text-white/60">{selectedListing.area}</p>
            )}

            {/* Meta grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/50">Room Type</p>
                <p className="mt-1 font-semibold text-white">{formatRoomType(selectedListing.room_type)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/50">Rent Range</p>
                <p className="mt-1 font-semibold text-white">
                  ${selectedListing.rent_min || '?'} - ${selectedListing.rent_max || '?'}/mo
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/50">Move-in Date</p>
                <p className="mt-1 font-semibold text-white">{formatDate(selectedListing.move_in)}</p>
              </div>
              {selectedListing.commute_area && (
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-white/50">Commute Area</p>
                  <p className="mt-1 font-semibold text-white">{selectedListing.commute_area}</p>
                </div>
              )}
            </div>

            {/* Private address (owner only) */}
            {user && selectedListing.user_id === user.id && selectedListing.full_address && (
              <div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-400">
                  <Lock className="h-4 w-4" />
                  Your Private Address
                </div>
                <p className="mt-2 text-white">{selectedListing.full_address}</p>
                <p className="mt-1 text-xs text-white/50">Only you can see this</p>
              </div>
            )}

            {/* Tags */}
            {selectedListing.tags && selectedListing.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedListing.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-white">About this listing</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {selectedListing.details || 'No additional details provided.'}
              </p>
            </div>

            {/* Poster info */}
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-white/5 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{getDisplayName(selectedListing)}</p>
                {getCompany(selectedListing) && (
                  <p className="text-sm text-white/60">{getCompany(selectedListing)}</p>
                )}
                {selectedListing.poster_profiles?.role && (
                  <p className="text-sm text-white/40">{selectedListing.poster_profiles.role}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowIntroModal(true)}
                className="h-12 flex-1 bg-teal-600 font-semibold text-white hover:bg-teal-500"
              >
                Request Intro
              </Button>
              <Button
                onClick={() => setShowReportModal(true)}
                variant="outline"
                className="h-12 border-white/20 text-white hover:bg-white/10"
              >
                Report
              </Button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Post Listing Modal */}
      <PostListingModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={loadListings}
      />

      {/* Request Intro Modal */}
      <BottomSheet
        open={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        title="Request an Introduction"
      >
        {selectedListing && (
          <form onSubmit={handleRequestIntro} className="p-4 sm:p-6">
            <p className="text-sm text-white/70">
              Send an intro request to {getDisplayName(selectedListing)}. 
              If they accept, you&apos;ll both receive each other&apos;s contact info.
            </p>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-white/90">Your Message</label>
              <textarea
                placeholder="Introduce yourself! Mention your job, schedule, and what you're looking for."
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                rows={4}
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              className="mt-4 h-12 w-full bg-teal-600 font-semibold text-white hover:bg-teal-500"
            >
              Send Intro Request
            </Button>
          </form>
        )}
      </BottomSheet>

      {/* Report Modal */}
      <BottomSheet
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Listing"
      >
        <form onSubmit={handleReport} className="p-4 sm:p-6">
          <p className="text-sm text-white/70">
            Help us keep SiteSisters safe. Reports are anonymous.
          </p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">Reason *</label>
              <select
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or fake listing</option>
                <option value="scam">Suspected scam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">Additional Details</label>
              <textarea
                placeholder="Any additional context that might help us review this report."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="mt-4 h-12 w-full bg-red-600 font-semibold text-white hover:bg-red-500"
          >
            Submit Report
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
