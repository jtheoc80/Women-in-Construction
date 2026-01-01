'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { useGatedAction, useAuth } from '@/contexts/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { MapPin, Target, X } from 'lucide-react'

// Types based on database schema
interface Listing {
  id: string
  user_id: string
  city: string
  area: string | null
  rent_min: number | null
  rent_max: number | null
  move_in: string | null
  room_type: string
  commute_area: string | null
  details: string | null
  is_active: boolean
  created_at: string
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  profiles?: {
    display_name: string
  }
}

// Supabase client (anon key - safe for client-side)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function fetchListings(filters: {
  city?: string
  rentMax?: number
  roomType?: string
}): Promise<Listing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return mock data if Supabase not configured
    return getMockListings()
  }

  let url = `${SUPABASE_URL}/rest/v1/listings?select=*,profiles(display_name)&is_active=eq.true&order=created_at.desc`
  
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
      id: '1',
      user_id: 'user1',
      city: 'Phoenix, AZ',
      area: 'Downtown',
      rent_min: 800,
      rent_max: 1000,
      move_in: '2026-02-01',
      room_type: 'private_room',
      commute_area: 'Intel Ocotillo',
      details: 'Looking for a clean, quiet roommate. I work early shifts at the data center construction site. Non-smoker preferred.',
      is_active: true,
      created_at: '2026-01-15T10:00:00Z',
      cover_photo_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
      profiles: { display_name: 'Sarah M.' }
    },
    {
      id: '2',
      user_id: 'user2',
      city: 'Austin, TX',
      area: 'Round Rock',
      rent_min: 700,
      rent_max: 900,
      move_in: '2026-01-20',
      room_type: 'shared_room',
      commute_area: 'Samsung Taylor',
      details: 'Friendly electrician looking to share a 2BR apartment near the fab site. Flexible on move-in date.',
      is_active: true,
      created_at: '2026-01-14T15:30:00Z',
      cover_photo_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      ],
      profiles: { display_name: 'Jessica R.' }
    },
    {
      id: '3',
      user_id: 'user3',
      city: 'Columbus, OH',
      area: 'New Albany',
      rent_min: 650,
      rent_max: 850,
      move_in: '2026-02-15',
      room_type: 'private_room',
      commute_area: 'Intel Ohio',
      details: 'HVAC tech on a 6-month project. Looking for month-to-month or short-term lease. I keep odd hours but am respectful.',
      is_active: true,
      created_at: '2026-01-13T09:00:00Z',
      cover_photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
      ],
      profiles: { display_name: 'Amanda K.' }
    },
    {
      id: '4',
      user_id: 'user4',
      city: 'Phoenix, AZ',
      area: 'Chandler',
      rent_min: 900,
      rent_max: 1100,
      move_in: '2026-03-01',
      room_type: 'entire_place',
      commute_area: 'TSMC Arizona',
      details: 'Have a whole 1BR available in a quiet complex. Perfect for someone who values privacy. Pool and gym access.',
      is_active: true,
      created_at: '2026-01-12T14:00:00Z',
      cover_photo_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
      profiles: { display_name: 'Michelle T.' }
    },
  ]
}

function getListingCoverPhotoUrl(listing: Listing): string | null {
  if (listing.cover_photo_url) return listing.cover_photo_url
  if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls[0]
  return null
}

function getListingPhotoCount(listing: Listing): number {
  if (listing.photo_urls) return listing.photo_urls.length
  return listing.cover_photo_url ? 1 : 0
}

// Room type display helper
function formatRoomType(type: string): string {
  switch (type) {
    case 'private_room': return 'Private Room'
    case 'shared_room': return 'Shared Room'
    case 'entire_place': return 'Entire Place'
    default: return type
  }
}

// Date formatting helper
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Flexible'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DesignPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  
  // Filters
  const [cityFilter, setCityFilter] = useState('')
  const [rentMaxFilter, setRentMaxFilter] = useState<number | ''>('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')
  
  // Modals
  const [showPostModal, setShowPostModal] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // Form states
  const [introMessage, setIntroMessage] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  
  // New listing form
  const [newListing, setNewListing] = useState({
    city: '',
    area: '',
    rent_min: '',
    rent_max: '',
    move_in: '',
    room_type: 'private_room',
    commute_area: '',
    details: '',
  })

  // Auth hooks for gating
  const { gateAction } = useGatedAction()
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

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
  }

  // Gated action handlers
  function handlePostListingClick() {
    gateAction(() => setShowPostModal(true))
  }

  function handleRequestIntroClick() {
    gateAction(() => setShowIntroModal(true))
  }

  async function handlePostListing(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user) {
      alert('Please sign in to post a listing')
      return
    }

    // Create the listing in Supabase
    try {
      const { error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          city: newListing.city,
          area: newListing.area || null,
          rent_min: newListing.rent_min ? parseInt(newListing.rent_min) : null,
          rent_max: newListing.rent_max ? parseInt(newListing.rent_max) : null,
          move_in: newListing.move_in || null,
          room_type: newListing.room_type,
          commute_area: newListing.commute_area || null,
          details: newListing.details || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating listing:', error)
        alert('Error creating listing: ' + error.message)
        return
      }

      alert('Listing posted successfully!')
      setShowPostModal(false)
      setNewListing({
        city: '',
        area: '',
        rent_min: '',
        rent_max: '',
        move_in: '',
        room_type: 'private_room',
        commute_area: '',
        details: '',
      })
      loadListings()
    } catch (err) {
      console.error('Error:', err)
      alert('An error occurred while posting the listing')
    }
  }

  async function handleRequestIntro(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user || !selectedListing) {
      alert('Please sign in to request an intro')
      return
    }

    // Create the intro request in Supabase
    try {
      const { error } = await supabase
        .from('intro_requests')
        .insert({
          listing_id: selectedListing.id,
          requester_user_id: user.id,
          message: introMessage,
          status: 'pending',
        })

      if (error) {
        console.error('Error creating intro request:', error)
        alert('Error sending intro request: ' + error.message)
        return
      }

      alert('Intro request sent! The listing owner will be notified.')
      setShowIntroModal(false)
      setIntroMessage('')
    } catch (err) {
      console.error('Error:', err)
      alert('An error occurred while sending the intro request')
    }
  }

  function handleReport(e: React.FormEvent) {
    e.preventDefault()
    // In production, this would POST to Supabase reports
    alert('Report submitted. Thank you for helping keep our community safe. (Demo mode)')
    setShowReportModal(false)
    setReportReason('')
    setReportDetails('')
  }

  return (
    <div style={styles.page}>
      {/* Header with Navbar */}
      <Navbar onPostListing={handlePostListingClick} />

      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Roommates who get the jobsite schedule.</h1>
        <p style={styles.heroSubtitle}>
          Women-first roommate matching for construction &amp; data center projects. 
          No public contact info. Intros by request.
        </p>
        <a href="/jobsites" style={styles.exploreButton}>
          <Target
            aria-hidden="true"
            size={16}
            style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}
          />
          Explore Housing by Jobsite
        </a>
      </section>

      {/* Filters */}
      <section style={styles.filters}>
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>City / Region</label>
            <input
              type="text"
              placeholder="e.g. Phoenix, Austin, Columbus..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={styles.filterInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Max Rent</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={rentMaxFilter}
              onChange={(e) => setRentMaxFilter(e.target.value ? parseInt(e.target.value) : '')}
              style={styles.filterInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Room Type</label>
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Types</option>
              <option value="private_room">Private Room</option>
              <option value="shared_room">Shared Room</option>
              <option value="entire_place">Entire Place</option>
            </select>
          </div>
          <button style={styles.searchButton} onClick={handleSearch}>
            Search
          </button>
        </div>
      </section>

      {/* Listings Grid */}
      <section style={styles.listingsSection}>
        <h2 style={styles.sectionTitle}>
          {loading ? 'Loading listings...' : `${listings.length} Listings Available`}
        </h2>
        
        {loading ? (
          <div style={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No listings match your filters. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {listings.map((listing) => (
              <div
                key={listing.id}
                style={styles.card}
                onClick={() => setSelectedListing(listing)}
              >
                {/* Photo Header */}
                <div style={styles.cardPhotoContainer}>
                  {getListingCoverPhotoUrl(listing) ? (
                    <img
                      src={getListingCoverPhotoUrl(listing)!}
                      alt={`${listing.area || listing.city} listing`}
                      style={styles.cardPhoto}
                      loading="lazy"
                    />
                  ) : (
                    <div style={styles.cardPhotoFallback}>
                      <span style={styles.cardPhotoFallbackText}>Photo coming soon</span>
                    </div>
                  )}

                  <span style={styles.cardTypeBadge}>
                    {formatRoomType(listing.room_type)}
                  </span>

                  {getListingPhotoCount(listing) > 0 && (
                    <span style={styles.cardPhotoCount}>
                      {getListingPhotoCount(listing)}{' '}
                      {getListingPhotoCount(listing) === 1 ? 'photo' : 'photos'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardCity}>{listing.city}</span>
                  </div>
                  <div style={styles.cardBody}>
                    {listing.area && <p style={styles.cardArea}>{listing.area}</p>}
                    <p style={styles.cardRent}>
                      ${listing.rent_min || '?'} - ${listing.rent_max || '?'}/mo
                    </p>
                    {listing.commute_area && (
                      <p style={styles.cardCommute}>
                        <MapPin
                          aria-hidden="true"
                          style={{ ...styles.commuteIcon, verticalAlign: 'text-bottom' }}
                          size={14}
                        />{' '}
                        Near {listing.commute_area}
                      </p>
                    )}
                    <p style={styles.cardMoveIn}>
                      Move-in: {formatDate(listing.move_in)}
                    </p>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardPoster}>
                      Posted by {listing.profiles?.display_name || 'Anonymous'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Listing Detail Drawer */}
      {selectedListing && (
        <div style={styles.drawerOverlay} onClick={() => setSelectedListing(null)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setSelectedListing(null)}>
              <X aria-hidden="true" size={18} />
            </button>
            <div style={styles.drawerContent}>
              <h2 style={styles.drawerTitle}>{selectedListing.city}</h2>
              {selectedListing.area && (
                <p style={styles.drawerArea}>{selectedListing.area}</p>
              )}
              
              <div style={styles.drawerMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Room Type</span>
                  <span style={styles.metaValue}>{formatRoomType(selectedListing.room_type)}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Rent Range</span>
                  <span style={styles.metaValue}>
                    ${selectedListing.rent_min || '?'} - ${selectedListing.rent_max || '?'}/mo
                  </span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Move-in Date</span>
                  <span style={styles.metaValue}>{formatDate(selectedListing.move_in)}</span>
                </div>
                {selectedListing.commute_area && (
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Commute Area</span>
                    <span style={styles.metaValue}>{selectedListing.commute_area}</span>
                  </div>
                )}
              </div>

              <div style={styles.drawerDetails}>
                <h3 style={styles.detailsTitle}>About this listing</h3>
                <p style={styles.detailsText}>
                  {selectedListing.details || 'No additional details provided.'}
                </p>
              </div>

              <div style={styles.drawerPoster}>
                Posted by <strong>{selectedListing.profiles?.display_name || 'Anonymous'}</strong>
              </div>

              <div style={styles.drawerActions}>
                <button
                  style={styles.introButton}
                  onClick={handleRequestIntroClick}
                >
                  Request Intro
                </button>
                <button
                  style={styles.reportButton}
                  onClick={() => setShowReportModal(true)}
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Listing Modal */}
      {showPostModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPostModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setShowPostModal(false)}>
              <X aria-hidden="true" size={18} />
            </button>
            <h2 style={styles.modalTitle}>Post a Listing</h2>
            <form onSubmit={handlePostListing} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoenix, AZ"
                    value={newListing.city}
                    onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Area/Neighborhood</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown, Chandler"
                    value={newListing.area}
                    onChange={(e) => setNewListing({ ...newListing, area: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Min Rent ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 700"
                    value={newListing.rent_min}
                    onChange={(e) => setNewListing({ ...newListing, rent_min: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Max Rent ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={newListing.rent_max}
                    onChange={(e) => setNewListing({ ...newListing, rent_max: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Room Type *</label>
                  <select
                    required
                    value={newListing.room_type}
                    onChange={(e) => setNewListing({ ...newListing, room_type: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="private_room">Private Room</option>
                    <option value="shared_room">Shared Room</option>
                    <option value="entire_place">Entire Place</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Move-in Date</label>
                  <input
                    type="date"
                    value={newListing.move_in}
                    onChange={(e) => setNewListing({ ...newListing, move_in: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Commute Area / Job Site</label>
                <input
                  type="text"
                  placeholder="e.g. Intel Ocotillo, TSMC Arizona"
                  value={newListing.commute_area}
                  onChange={(e) => setNewListing({ ...newListing, commute_area: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Details</label>
                <textarea
                  placeholder="Tell potential roommates about yourself, your schedule, preferences, etc."
                  value={newListing.details}
                  onChange={(e) => setNewListing({ ...newListing, details: e.target.value })}
                  style={styles.formTextarea}
                  rows={4}
                />
              </div>
              <button type="submit" style={styles.submitButton}>
                Post Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Intro Modal */}
      {showIntroModal && selectedListing && (
        <div style={styles.modalOverlay} onClick={() => setShowIntroModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setShowIntroModal(false)}>
              <X aria-hidden="true" size={18} />
            </button>
            <h2 style={styles.modalTitle}>Request an Introduction</h2>
            <p style={styles.modalSubtitle}>
              Send an intro request to {selectedListing.profiles?.display_name || 'this poster'}. 
              If they accept, you&apos;ll both receive each other&apos;s contact info.
            </p>
            <form onSubmit={handleRequestIntro} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Your Message</label>
                <textarea
                  placeholder="Introduce yourself! Mention your job, schedule, and what you're looking for in a roommate."
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  style={styles.formTextarea}
                  rows={4}
                  required
                />
              </div>
              <button type="submit" style={styles.submitButton}>
                Send Intro Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedListing && (
        <div style={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setShowReportModal(false)}>
              <X aria-hidden="true" size={18} />
            </button>
            <h2 style={styles.modalTitle}>Report Listing</h2>
            <p style={styles.modalSubtitle}>
              Help us keep SiteSisters safe. Reports are anonymous.
            </p>
            <form onSubmit={handleReport} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Reason *</label>
                <select
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="">Select a reason...</option>
                  <option value="spam">Spam or fake listing</option>
                  <option value="scam">Suspected scam</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="not_women_focused">Not relevant to women in construction</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Additional Details</label>
                <textarea
                  placeholder="Any additional context that might help us review this report."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  style={styles.formTextarea}
                  rows={3}
                />
              </div>
              <button type="submit" style={styles.reportSubmitButton}>
                Submit Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 SiteSisters. All rights reserved.</p>
        <p style={styles.footerTagline}>Built for women who build.</p>
      </footer>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
  },
  hero: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    padding: '60px 24px',
    textAlign: 'center',
  },
  heroTitle: {
    color: 'white',
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '16px',
    maxWidth: '700px',
    margin: '0 auto 16px',
    lineHeight: 1.2,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: '1.15rem',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  exploreButton: {
    display: 'inline-block',
    marginTop: '24px',
    background: '#f97316',
    color: 'white',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  filters: {
    background: 'white',
    padding: '24px',
    borderBottom: '1px solid #e2e8f0',
  },
  filterRow: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterGroup: {
    flex: '1 1 200px',
    minWidth: '150px',
  },
  filterLabel: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
  },
  filterInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  filterSelect: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    background: 'white',
  },
  searchButton: {
    background: '#1e293b',
    color: 'white',
    border: 'none',
    padding: '10px 28px',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    height: '42px',
  },
  listingsSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  skeletonCard: {
    background: '#e2e8f0',
    borderRadius: '12px',
    height: '220px',
    animation: 'pulse 1.5s infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e2e8f0',
  },
  cardPhotoContainer: {
    position: 'relative',
    height: '160px',
    background: '#f1f5f9',
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardPhotoFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(51,65,85,0.9) 100%)',
  },
  cardPhotoFallbackText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  cardTypeBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(255,255,255,0.92)',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
  },
  cardPhotoCount: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  cardContent: {
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardCity: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  cardBody: {
    marginBottom: '12px',
  },
  cardArea: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '8px',
  },
  cardRent: {
    color: '#1e293b',
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '8px',
  },
  cardCommute: {
    color: '#64748b',
    fontSize: '0.85rem',
    marginBottom: '6px',
  },
  commuteIcon: {
    marginRight: '4px',
  },
  cardMoveIn: {
    color: '#64748b',
    fontSize: '0.85rem',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },
  cardPoster: {
    color: '#94a3b8',
    fontSize: '0.8rem',
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    background: 'white',
    width: '100%',
    maxWidth: '480px',
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
  },
  drawerContent: {
    padding: '32px 24px',
  },
  drawerTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '4px',
  },
  drawerArea: {
    color: '#64748b',
    fontSize: '1rem',
    marginBottom: '24px',
  },
  drawerMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  metaItem: {
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
  },
  metaLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metaValue: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  drawerDetails: {
    marginBottom: '24px',
  },
  detailsTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '8px',
  },
  detailsText: {
    color: '#475569',
    lineHeight: 1.7,
    fontSize: '0.95rem',
  },
  drawerPoster: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  drawerActions: {
    display: 'flex',
    gap: '12px',
  },
  introButton: {
    flex: 1,
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  reportButton: {
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '14px 20px',
    fontSize: '0.9rem',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    padding: '32px',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '8px',
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  formLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
  },
  formInput: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
  },
  formSelect: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    background: 'white',
  },
  formTextarea: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  submitButton: {
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  reportSubmitButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: {
    background: '#1e293b',
    padding: '32px 24px',
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: '40px',
  },
  footerTagline: {
    marginTop: '8px',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
}
