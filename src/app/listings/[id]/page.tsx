'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { PhotoGallery } from '@/components/PhotoGallery'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth, useGatedAction } from '@/contexts/AuthContext'
import { getDemoListingById, type DemoListing } from '@/lib/demo/demoListings'
import { Sun, Sunrise, Moon, Loader2, X, MapPin, Calendar, User, Building2, Check, AlertCircle } from 'lucide-react'

// Types for DB listing
interface DBListing {
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
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  profiles?: { display_name: string }
  poster_profiles?: { display_name: string; company: string | null }
  shift?: string
}

// Unified listing type for rendering
interface UnifiedListing {
  id: string
  isDemo: boolean
  title: string
  city: string
  area: string | null
  state?: string
  rentMin: number | null
  rentMax: number | null
  moveIn: string | null
  roomType: string
  roomTypeDisplay: string
  nearLabel: string | null
  description: string | null
  photoUrls: string[]
  amenities: string[]
  rules: string[]
  postedByName: string
  companyName: string | null
  shift?: string | null
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

function formatPrice(min: number | null, max: number | null): string {
  const hasMin = min != null && min > 0
  const hasMax = max != null && max > 0
  
  if (hasMin && hasMax) {
    if (min === max) {
      return `$${min.toLocaleString()}/mo`
    }
    return `$${min.toLocaleString()} – $${max.toLocaleString()}/mo`
  }
  if (hasMin) return `$${min.toLocaleString()}/mo`
  if (hasMax) return `$${max.toLocaleString()}/mo`
  return 'Contact for price'
}

/**
 * Convert a demo listing to unified format
 */
function demoToUnified(demo: DemoListing): UnifiedListing {
  return {
    id: demo.id,
    isDemo: true,
    title: demo.title,
    city: demo.city,
    area: demo.countyOrArea,
    state: demo.state,
    rentMin: demo.priceMin,
    rentMax: demo.priceMax,
    moveIn: demo.moveInDate,
    roomType: demo.roomTypeRaw,
    roomTypeDisplay: demo.roomType,
    nearLabel: demo.nearLabel,
    description: demo.description,
    photoUrls: demo.photoUrls,
    amenities: demo.amenities,
    rules: demo.rules,
    postedByName: demo.postedByName,
    companyName: demo.companyName,
    shift: demo.shift,
  }
}

/**
 * Convert a DB listing to unified format
 */
function dbToUnified(db: DBListing): UnifiedListing {
  // Collect photo URLs
  const photoUrls: string[] = []
  if (db.cover_photo_url) photoUrls.push(db.cover_photo_url)
  if (db.photo_urls) photoUrls.push(...db.photo_urls)
  
  return {
    id: db.id,
    isDemo: false,
    title: db.title || db.area || db.city,
    city: db.city,
    area: db.area,
    rentMin: db.rent_min,
    rentMax: db.rent_max,
    moveIn: db.move_in,
    roomType: db.room_type,
    roomTypeDisplay: formatRoomType(db.room_type),
    nearLabel: db.commute_area,
    description: db.details,
    photoUrls,
    amenities: db.tags || [],
    rules: [],
    postedByName: db.poster_profiles?.display_name || db.profiles?.display_name || 'Anonymous',
    companyName: db.poster_profiles?.company || null,
    shift: db.shift,
  }
}

export default function ListingPage() {
  const params = useParams()
  const id = params.id as string
  const [listing, setListing] = useState<UnifiedListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [introMessage, setIntroMessage] = useState('')
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  
  const supabase = getSupabaseBrowserClient()
  const { user } = useAuth()
  const { gateAction } = useGatedAction()

  useEffect(() => {
    async function loadListing() {
      setLoading(true)
      
      // Step 1: Check if this is a demo listing ID
      const demoListing = getDemoListingById(id)
      
      // Step 2: If ID looks like a DB ID (UUID or numeric), try fetching from DB
      const isDbId = !id.startsWith('demo-')
      
      if (isDbId) {
        try {
          const { data, error } = await supabase
            .from('listings')
            .select('*, poster_profiles(*), profiles:user_id(display_name)')
            .eq('id', id)
            .single()
          
          if (!error && data) {
            // DB listing found - use it
            setListing(dbToUnified(data))
            setDbUserId(data.user_id)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('[ListingPage] Error fetching DB listing:', err)
        }
      }
      
      // Step 3: DB fetch failed or not a DB ID - try demo listing
      if (demoListing) {
        setListing(demoToUnified(demoListing))
        setDbUserId(null)
        setLoading(false)
        return
      }
      
      // Step 4: Neither DB nor demo found
      setListing(null)
      setLoading(false)
    }
    
    loadListing()
  }, [id, supabase])

  const handleRequestIntroClick = () => {
    if (listing?.isDemo) {
      // Demo listings can't receive intro requests
      return
    }
    gateAction(() => setShowIntroModal(true))
  }

  const handleRequestIntro = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !listing || listing.isDemo || !dbUserId) return

    try {
      const { error } = await supabase
        .from('listing_requests')
        .insert({
          listing_id: listing.id,
          from_user_id: user.id,
          to_user_id: dbUserId,
          message: introMessage,
          status: 'pending',
        })

      if (error) {
        console.error('Error creating listing request:', error)
        alert('Error sending request: ' + error.message)
        return
      }

      alert('Request sent! The listing owner will see it in their Inbox.')
      setShowIntroModal(false)
      setIntroMessage('')
    } catch (err) {
      console.error('Error:', err)
      alert('An error occurred while sending the request')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Listing not found</h1>
          <p className="mt-2 text-slate-500">This listing may have been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
          {/* Photo Gallery */}
          <PhotoGallery 
            photos={listing.photoUrls} 
            alt={listing.title}
          />

          <div className="p-6 sm:p-8">
            {/* Header with Demo Badge */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 border border-teal-200">
                      {listing.roomTypeDisplay}
                    </span>
                    {listing.isDemo && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Demo Listing
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {listing.title}
                  </h1>
                  <p className="flex items-center gap-2 text-slate-500 mt-1">
                    <MapPin className="h-4 w-4" />
                    {listing.city}
                    {listing.area && `, ${listing.area}`}
                    {listing.state && `, ${listing.state}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(listing.rentMin, listing.rentMax)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3">
              {listing.nearLabel && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Near</p>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {listing.nearLabel}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Move-in</p>
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(listing.moveIn)}
                </p>
              </div>

              {listing.shift && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Shift</p>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {listing.shift === 'day' && <><Sun className="h-4 w-4 text-amber-500" /> Day</>}
                    {listing.shift === 'swing' && <><Sunrise className="h-4 w-4 text-orange-500" /> Swing</>}
                    {listing.shift === 'night' && <><Moon className="h-4 w-4 text-indigo-500" /> Night</>}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About this listing</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No additional details provided.'}
              </div>
            </div>

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                      <Check className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {listing.rules.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">House Rules</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Poster Info & CTA */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Posted by</p>
                    <p className="font-medium text-slate-900">
                      {listing.postedByName}
                      {listing.companyName && (
                        <span className="text-slate-500 font-normal flex items-center gap-1 text-sm mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {listing.companyName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {listing.isDemo ? (
                  <div className="flex flex-col items-center gap-2 sm:items-end">
                    <button
                      disabled
                      className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed sm:w-auto w-full"
                    >
                      Request Intro
                    </button>
                    <p className="text-xs text-slate-400">
                      {user ? 'This is a demo listing' : 'Sign in to request intros'}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestIntroClick}
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors sm:w-auto w-full"
                  >
                    Request Intro
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Intro Request Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowIntroModal(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Request Intro</h2>
              <button onClick={() => setShowIntroModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="mb-6 text-sm text-slate-600">
              Send an intro request to {listing.postedByName}. If they accept, you&apos;ll both receive each other&apos;s contact info.
            </p>

            <form onSubmit={handleRequestIntro} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Your Message</label>
                <textarea
                  required
                  placeholder="Introduce yourself! Mention your job, schedule, and what you're looking for."
                  value={introMessage}
                  onChange={e => setIntroMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 min-h-[120px]"
                />
              </div>
              
              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                Send Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
