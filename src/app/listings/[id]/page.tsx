'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ListingPhotoGallery } from '@/components/PhotoGallery'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth, useGatedAction } from '@/contexts/AuthContext'
import { Sun, Sunrise, Moon, Loader2, X, MapPin } from 'lucide-react'

// Types
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
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  profiles?: { display_name: string }
  poster_profiles?: { display_name: string; company: string | null }
  shift?: string
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

export default function ListingPage() {
  const params = useParams()
  const id = params.id as string
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [introMessage, setIntroMessage] = useState('')
  
  const supabase = getSupabaseBrowserClient()
  const { user } = useAuth()
  const { gateAction } = useGatedAction()

  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase
        .from('listings')
        .select('*, poster_profiles(*), profiles:user_id(display_name)')
        .eq('id', id)
        .single()
      
      if (data) setListing(data)
      setLoading(false)
    }
    loadListing()
  }, [id, supabase])

  const handleRequestIntroClick = () => {
    gateAction(() => setShowIntroModal(true))
  }

  const handleRequestIntro = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !listing) return

    try {
      const { error } = await supabase
        .from('listing_requests')
        .insert({
          listing_id: listing.id,
          from_user_id: user.id,
          to_user_id: listing.user_id, // Note: using listing.user_id (auth user id) not poster_profile_id
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

  const displayName = listing.poster_profiles?.display_name || listing.profiles?.display_name || 'Anonymous'
  const company = listing.poster_profiles?.company

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
          {/* Photo Gallery */}
          <ListingPhotoGallery listing={listing} />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {listing.area || listing.city}
              </h1>
              <p className="flex items-center gap-2 text-slate-500 mt-1">
                <MapPin className="h-4 w-4" />
                {listing.city}
              </p>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Rent</p>
                <p className="font-semibold text-slate-900">
                  ${listing.rent_min || '?'} - ${listing.rent_max || '?'}/mo
                </p>
              </div>
              
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Room Type</p>
                <p className="font-semibold text-slate-900">
                  {formatRoomType(listing.room_type)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Move-in</p>
                <p className="font-semibold text-slate-900">
                  {formatDate(listing.move_in)}
                </p>
              </div>

              {listing.shift && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Shift</p>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {listing.shift === 'day' && <><Sun className="h-4 w-4" /> Day</>}
                    {listing.shift === 'swing' && <><Sunrise className="h-4 w-4" /> Swing</>}
                    {listing.shift === 'night' && <><Moon className="h-4 w-4" /> Night</>}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About this listing</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {listing.details || 'No additional details provided.'}
              </p>
            </div>

            {/* Poster Info & CTA */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Posted by</p>
                  <p className="font-medium text-slate-900">
                    {displayName}
                    {company && <span className="text-slate-500 font-normal"> • {company}</span>}
                  </p>
                </div>
                
                <button
                  onClick={handleRequestIntroClick}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors sm:w-auto w-full"
                >
                  Request Intro
                </button>
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
              Send an intro request to {displayName}. If they accept, you&apos;ll both receive each other&apos;s contact info.
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
