'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Listing, RankedHub, Jobsite } from '@/lib/supabase'

// Types
interface PlanMoveResponse {
  hubs: RankedHub[]
  listings: Listing[]
  jobsite: Jobsite | null
  scarcity: {
    listings_14d: number
    avg_response_hours: number | null
    is_scarce: boolean
  }
}

interface PlanFilters {
  budget_min: number | ''
  budget_max: number | ''
  commute_max: number
  room_type: string
  shift: string
  move_in_date: string
}

// Room type display helper
function formatRoomType(type: string): string {
  switch (type) {
    case 'private_room':
      return 'Private Room'
    case 'shared_room':
      return 'Shared Room'
    case 'entire_place':
      return 'Entire Place'
    default:
      return type
  }
}

// Date formatting helper
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Flexible'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Relative time helper
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

// Photo count helper
function getPhotoCount(listing: Listing): number {
  if (!listing.photo_urls) return listing.cover_photo_url ? 1 : 0
  return listing.photo_urls.length
}

// Hub Tile Component
function HubTile({
  hub,
  isSelected,
  onClick,
}: {
  hub: RankedHub
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button onClick={onClick} style={hubTileStyles.container(isSelected)}>
      <div style={hubTileStyles.header}>
        <span style={hubTileStyles.name}>{hub.hub_name}</span>
        <span style={hubTileStyles.commute}>
          {hub.commute_min}-{hub.commute_max} min
        </span>
      </div>
      <div style={hubTileStyles.stats}>
        <div style={hubTileStyles.stat}>
          <span style={hubTileStyles.statValue}>{hub.listing_count_30d}</span>
          <span style={hubTileStyles.statLabel}>listings</span>
        </div>
        {hub.median_rent_min && hub.median_rent_max && (
          <div style={hubTileStyles.stat}>
            <span style={hubTileStyles.statValue}>
              ${hub.median_rent_min}-${hub.median_rent_max}
            </span>
            <span style={hubTileStyles.statLabel}>rent range</span>
          </div>
        )}
        {hub.median_response_hours !== null && (
          <div style={hubTileStyles.stat}>
            <span style={hubTileStyles.statValue}>
              {hub.median_response_hours < 1
                ? '<1h'
                : `${Math.round(hub.median_response_hours)}h`}
            </span>
            <span style={hubTileStyles.statLabel}>response</span>
          </div>
        )}
      </div>
      {hub.listing_count_30d === 0 && (
        <div style={hubTileStyles.noListings}>No active listings</div>
      )}
    </button>
  )
}

const hubTileStyles = {
  container: (isSelected: boolean): React.CSSProperties => ({
    background: isSelected ? '#fef3c7' : 'white',
    border: isSelected ? '2px solid #f97316' : '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%',
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,
  name: {
    fontWeight: 600,
    fontSize: '1rem',
    color: '#1e293b',
  } as React.CSSProperties,
  commute: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 500,
  } as React.CSSProperties,
  stats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  } as React.CSSProperties,
  statValue: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#1e293b',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.7rem',
    color: '#64748b',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  noListings: {
    marginTop: '8px',
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  } as React.CSSProperties,
}

// Photo-Forward Listing Card Component
function ListingCard({
  listing,
  onClick,
}: {
  listing: Listing
  onClick: () => void
}) {
  const photoCount = getPhotoCount(listing)
  const hasPhotos = photoCount > 0

  return (
    <button onClick={onClick} style={listingCardStyles.container}>
      {/* Photo Section */}
      <div style={listingCardStyles.photoContainer}>
        {hasPhotos ? (
          <>
            <img
              src={listing.cover_photo_url!}
              alt={`${listing.area || listing.city} listing`}
              style={listingCardStyles.photo}
            />
            <span style={listingCardStyles.photoCount}>{photoCount} photos</span>
          </>
        ) : (
          <div style={listingCardStyles.noPhoto}>
            <span style={listingCardStyles.noPhotoIcon}>📷</span>
            <span style={listingCardStyles.noPhotoText}>No photos yet</span>
          </div>
        )}
        {/* Room type badge */}
        <span style={listingCardStyles.typeBadge}>
          {formatRoomType(listing.room_type)}
        </span>
      </div>

      {/* Content Section */}
      <div style={listingCardStyles.content}>
        <div style={listingCardStyles.locationRow}>
          <span style={listingCardStyles.area}>
            {listing.area || listing.city}
          </span>
          <span style={listingCardStyles.time}>{timeAgo(listing.created_at)}</span>
        </div>

        <div style={listingCardStyles.rent}>
          ${listing.rent_min || '?'} - ${listing.rent_max || '?'}/mo
        </div>

        {listing.shift && (
          <div style={listingCardStyles.shift}>
            {listing.shift === 'day' && '☀️ Day shift'}
            {listing.shift === 'swing' && '🌅 Swing shift'}
            {listing.shift === 'night' && '🌙 Night shift'}
          </div>
        )}

        <div style={listingCardStyles.moveIn}>
          Move-in: {formatDate(listing.move_in)}
        </div>

        <div style={listingCardStyles.poster}>
          {listing.profiles?.display_name || 'Anonymous'}
        </div>
      </div>
    </button>
  )
}

const listingCardStyles = {
  container: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    width: '100%',
    textAlign: 'left',
  } as React.CSSProperties,
  photoContainer: {
    position: 'relative',
    height: '160px',
    background: '#f1f5f9',
  } as React.CSSProperties,
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as React.CSSProperties,
  photoCount: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 500,
  } as React.CSSProperties,
  noPhoto: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '8px',
  } as React.CSSProperties,
  noPhotoIcon: {
    fontSize: '2rem',
    opacity: 0.5,
  } as React.CSSProperties,
  noPhotoText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  } as React.CSSProperties,
  typeBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'white',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  content: {
    padding: '16px',
  } as React.CSSProperties,
  locationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  } as React.CSSProperties,
  area: {
    fontWeight: 600,
    fontSize: '1rem',
    color: '#1e293b',
  } as React.CSSProperties,
  time: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  } as React.CSSProperties,
  rent: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '8px',
  } as React.CSSProperties,
  shift: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginBottom: '4px',
  } as React.CSSProperties,
  moveIn: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginBottom: '8px',
  } as React.CSSProperties,
  poster: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px',
  } as React.CSSProperties,
}

// Plan My Move Modal Component
function PlanMyMoveModal({
  isOpen,
  onClose,
  jobsite,
  onApplyFilters,
  initialFilters,
}: {
  isOpen: boolean
  onClose: () => void
  jobsite: Jobsite | null
  onApplyFilters: (filters: PlanFilters) => void
  initialFilters: PlanFilters
}) {
  const [filters, setFilters] = useState<PlanFilters>(initialFilters)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApplyFilters(filters)
    onClose()
  }

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={modalStyles.closeButton} onClick={onClose}>
          ✕
        </button>
        <h2 style={modalStyles.title}>Plan My Move</h2>
        <p style={modalStyles.subtitle}>
          Find housing near {jobsite?.name || 'this jobsite'}
        </p>

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          {/* Budget */}
          <div style={modalStyles.formRow}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Min Budget ($)</label>
              <input
                type="number"
                placeholder="e.g. 600"
                value={filters.budget_min}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    budget_min: e.target.value ? parseInt(e.target.value) : '',
                  })
                }
                style={modalStyles.input}
              />
            </div>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Max Budget ($)</label>
              <input
                type="number"
                placeholder="e.g. 1200"
                value={filters.budget_max}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    budget_max: e.target.value ? parseInt(e.target.value) : '',
                  })
                }
                style={modalStyles.input}
              />
            </div>
          </div>

          {/* Commute Max */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Max Commute Time</label>
            <div style={modalStyles.radioGroup}>
              {[15, 30, 45, 60].map((min) => (
                <label key={min} style={modalStyles.radioLabel}>
                  <input
                    type="radio"
                    name="commute_max"
                    value={min}
                    checked={filters.commute_max === min}
                    onChange={() => setFilters({ ...filters, commute_max: min })}
                    style={modalStyles.radio}
                  />
                  {min} min
                </label>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Room Type</label>
            <select
              value={filters.room_type}
              onChange={(e) =>
                setFilters({ ...filters, room_type: e.target.value })
              }
              style={modalStyles.select}
            >
              <option value="all">All Types</option>
              <option value="private_room">Private Room</option>
              <option value="shared_room">Shared Room</option>
              <option value="entire_place">Entire Place</option>
            </select>
          </div>

          {/* Shift */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Preferred Shift</label>
            <select
              value={filters.shift}
              onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
              style={modalStyles.select}
            >
              <option value="all">Any Shift</option>
              <option value="day">Day Shift</option>
              <option value="swing">Swing Shift</option>
              <option value="night">Night Shift</option>
            </select>
          </div>

          {/* Move-in Date */}
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Move-in After (optional)</label>
            <input
              type="date"
              value={filters.move_in_date}
              onChange={(e) =>
                setFilters({ ...filters, move_in_date: e.target.value })
              }
              style={modalStyles.input}
            />
          </div>

          <button type="submit" style={modalStyles.submitButton}>
            Find Housing
          </button>
        </form>
      </div>
    </div>
  )
}

const modalStyles = {
  overlay: {
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
  } as React.CSSProperties,
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    padding: '32px',
  } as React.CSSProperties,
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
  } as React.CSSProperties,
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '8px',
  } as React.CSSProperties,
  subtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    marginBottom: '24px',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  } as React.CSSProperties,
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  } as React.CSSProperties,
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
  } as React.CSSProperties,
  input: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
  } as React.CSSProperties,
  select: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    background: 'white',
  } as React.CSSProperties,
  radioGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#475569',
  } as React.CSSProperties,
  radio: {
    cursor: 'pointer',
  } as React.CSSProperties,
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
  } as React.CSSProperties,
}

// Listing Detail Drawer Component
function ListingDrawer({
  listing,
  onClose,
}: {
  listing: Listing | null
  onClose: () => void
}) {
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [introMessage, setIntroMessage] = useState('')

  if (!listing) return null

  const photoCount = getPhotoCount(listing)

  const handleRequestIntro = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Intro request sent! (Demo mode - no actual database write)')
    setShowIntroModal(false)
    setIntroMessage('')
  }

  return (
    <div style={drawerStyles.overlay} onClick={onClose}>
      <div style={drawerStyles.drawer} onClick={(e) => e.stopPropagation()}>
        <button style={drawerStyles.closeButton} onClick={onClose}>
          ✕
        </button>

        {/* Photo Gallery */}
        {listing.cover_photo_url && (
          <div style={drawerStyles.photoGallery}>
            <img
              src={listing.cover_photo_url}
              alt="Listing"
              style={drawerStyles.mainPhoto}
            />
            {photoCount > 1 && (
              <div style={drawerStyles.photoCountBadge}>
                {photoCount} photos
              </div>
            )}
          </div>
        )}

        <div style={drawerStyles.content}>
          <h2 style={drawerStyles.title}>{listing.area || listing.city}</h2>
          <p style={drawerStyles.location}>{listing.city}</p>

          <div style={drawerStyles.meta}>
            <div style={drawerStyles.metaItem}>
              <span style={drawerStyles.metaLabel}>Rent Range</span>
              <span style={drawerStyles.metaValue}>
                ${listing.rent_min || '?'} - ${listing.rent_max || '?'}/mo
              </span>
            </div>
            <div style={drawerStyles.metaItem}>
              <span style={drawerStyles.metaLabel}>Room Type</span>
              <span style={drawerStyles.metaValue}>
                {formatRoomType(listing.room_type)}
              </span>
            </div>
            <div style={drawerStyles.metaItem}>
              <span style={drawerStyles.metaLabel}>Move-in</span>
              <span style={drawerStyles.metaValue}>
                {formatDate(listing.move_in)}
              </span>
            </div>
            {listing.shift && (
              <div style={drawerStyles.metaItem}>
                <span style={drawerStyles.metaLabel}>Shift</span>
                <span style={drawerStyles.metaValue}>
                  {listing.shift === 'day' && '☀️ Day'}
                  {listing.shift === 'swing' && '🌅 Swing'}
                  {listing.shift === 'night' && '🌙 Night'}
                </span>
              </div>
            )}
          </div>

          <div style={drawerStyles.details}>
            <h3 style={drawerStyles.detailsTitle}>About this listing</h3>
            <p style={drawerStyles.detailsText}>
              {listing.details || 'No additional details provided.'}
            </p>
          </div>

          <div style={drawerStyles.poster}>
            Posted by{' '}
            <strong>{listing.profiles?.display_name || 'Anonymous'}</strong>
          </div>

          <button
            style={drawerStyles.introButton}
            onClick={() => setShowIntroModal(true)}
          >
            Request Intro
          </button>
        </div>
      </div>

      {/* Intro Request Modal */}
      {showIntroModal && (
        <div
          style={modalStyles.overlay}
          onClick={() => setShowIntroModal(false)}
        >
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              style={modalStyles.closeButton}
              onClick={() => setShowIntroModal(false)}
            >
              ✕
            </button>
            <h2 style={modalStyles.title}>Request an Introduction</h2>
            <p style={modalStyles.subtitle}>
              Send an intro request to{' '}
              {listing.profiles?.display_name || 'this poster'}. If they accept,
              you&apos;ll both receive each other&apos;s contact info.
            </p>
            <form onSubmit={handleRequestIntro} style={modalStyles.form}>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Your Message</label>
                <textarea
                  placeholder="Introduce yourself! Mention your job, schedule, and what you're looking for."
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  style={{ ...modalStyles.input, minHeight: '100px', resize: 'vertical' }}
                  required
                />
              </div>
              <button type="submit" style={modalStyles.submitButton}>
                Send Intro Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const drawerStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  drawer: {
    background: 'white',
    width: '100%',
    maxWidth: '480px',
    height: '100%',
    overflowY: 'auto',
    position: 'relative',
  } as React.CSSProperties,
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255,255,255,0.9)',
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
    zIndex: 10,
  } as React.CSSProperties,
  photoGallery: {
    position: 'relative',
    height: '250px',
    background: '#f1f5f9',
  } as React.CSSProperties,
  mainPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as React.CSSProperties,
  photoCountBadge: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 500,
  } as React.CSSProperties,
  content: {
    padding: '24px',
  } as React.CSSProperties,
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '4px',
  } as React.CSSProperties,
  location: {
    color: '#64748b',
    fontSize: '1rem',
    marginBottom: '20px',
  } as React.CSSProperties,
  meta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  } as React.CSSProperties,
  metaItem: {
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
  } as React.CSSProperties,
  metaLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  metaValue: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1e293b',
  } as React.CSSProperties,
  details: {
    marginBottom: '24px',
  } as React.CSSProperties,
  detailsTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '8px',
  } as React.CSSProperties,
  detailsText: {
    color: '#475569',
    lineHeight: 1.7,
    fontSize: '0.95rem',
  } as React.CSSProperties,
  poster: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginBottom: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  } as React.CSSProperties,
  introButton: {
    width: '100%',
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
}

// Scarcity Alert Component
function ScarcityAlert({
  scarcity,
  jobsiteName,
}: {
  scarcity: PlanMoveResponse['scarcity']
  jobsiteName: string
}) {
  if (!scarcity.is_scarce) return null

  return (
    <div style={scarcityStyles.container}>
      <div style={scarcityStyles.icon}>⚠️</div>
      <div style={scarcityStyles.content}>
        <div style={scarcityStyles.title}>Limited Housing Near {jobsiteName}</div>
        <div style={scarcityStyles.text}>
          Only <strong>{scarcity.listings_14d}</strong> new listings in the last
          14 days.
          {scarcity.avg_response_hours && (
            <>
              {' '}
              Average response time:{' '}
              <strong>{Math.round(scarcity.avg_response_hours)} hours</strong>.
            </>
          )}
        </div>
        <div style={scarcityStyles.tip}>
          💡 Tip: Consider expanding your search to nearby hubs or posting a
          &quot;Looking for Housing&quot; listing.
        </div>
      </div>
    </div>
  )
}

const scarcityStyles = {
  container: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  } as React.CSSProperties,
  icon: {
    fontSize: '1.5rem',
  } as React.CSSProperties,
  content: {
    flex: 1,
  } as React.CSSProperties,
  title: {
    fontWeight: 600,
    color: '#92400e',
    marginBottom: '4px',
  } as React.CSSProperties,
  text: {
    fontSize: '0.9rem',
    color: '#78350f',
    marginBottom: '8px',
  } as React.CSSProperties,
  tip: {
    fontSize: '0.85rem',
    color: '#92400e',
    fontStyle: 'italic',
  } as React.CSSProperties,
}

// Main Page Component
export default function JobsiteExplorerPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PlanMoveResponse | null>(null)
  const [selectedHub, setSelectedHub] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [filters, setFilters] = useState<PlanFilters>({
    budget_min: '',
    budget_max: '',
    commute_max: 45,
    room_type: 'all',
    shift: 'all',
    move_in_date: '',
  })
  const [filtersApplied, setFiltersApplied] = useState(false)

  const fetchData = useCallback(async (appliedFilters?: PlanFilters) => {
    setLoading(true)
    try {
      const currentFilters = appliedFilters || filters

      const response = await fetch('/api/plan-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobsite_slug: slug,
          budget_min: currentFilters.budget_min || undefined,
          budget_max: currentFilters.budget_max || undefined,
          commute_max: currentFilters.commute_max,
          room_type:
            currentFilters.room_type !== 'all'
              ? currentFilters.room_type
              : undefined,
          shift:
            currentFilters.shift !== 'all' ? currentFilters.shift : undefined,
          move_in_date: currentFilters.move_in_date || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch')
      }

      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [slug, filters])

  useEffect(() => {
    fetchData()
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = (newFilters: PlanFilters) => {
    setFilters(newFilters)
    setFiltersApplied(true)
    fetchData(newFilters)
  }

  const handleClearFilters = () => {
    const defaultFilters: PlanFilters = {
      budget_min: '',
      budget_max: '',
      commute_max: 45,
      room_type: 'all',
      shift: 'all',
      move_in_date: '',
    }
    setFilters(defaultFilters)
    setFiltersApplied(false)
    fetchData(defaultFilters)
  }

  // Filter listings by selected hub
  const displayedListings = selectedHub
    ? data?.listings.filter((l) => l.hub_id === selectedHub) || []
    : data?.listings || []

  // Sort listings: with photos first, then by date
  const sortedListings = [...displayedListings].sort((a, b) => {
    const aPhotos = getPhotoCount(a)
    const bPhotos = getPhotoCount(b)

    // Listings with 2+ photos rank highest
    if (aPhotos >= 2 && bPhotos < 2) return -1
    if (bPhotos >= 2 && aPhotos < 2) return 1

    // Then listings with 1 photo
    if (aPhotos >= 1 && bPhotos < 1) return -1
    if (bPhotos >= 1 && aPhotos < 1) return 1

    // Finally by date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div style={pageStyles.page}>
      {/* Header */}
      <header style={pageStyles.header}>
        <div style={pageStyles.headerContent}>
          <button style={pageStyles.backButton} onClick={() => router.push('/design')}>
            ← Back
          </button>
          <div style={pageStyles.logo}>
            <span style={pageStyles.logoIcon}>🏠</span>
            <span style={pageStyles.logoText}>SiteSisters</span>
          </div>
          <div style={{ width: '80px' }} /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Jobsite Hero */}
      <section style={pageStyles.hero}>
        <h1 style={pageStyles.heroTitle}>
          {data?.jobsite?.name || 'Loading...'}
        </h1>
        <p style={pageStyles.heroSubtitle}>
          {data?.jobsite
            ? `${data.jobsite.city}, ${data.jobsite.state}`
            : 'Finding housing options...'}
        </p>
        <button
          style={pageStyles.planButton}
          onClick={() => setShowPlanModal(true)}
        >
          🎯 Plan My Move
        </button>
      </section>

      {/* Filters Applied Bar */}
      {filtersApplied && (
        <div style={pageStyles.filtersBar}>
          <span style={pageStyles.filtersLabel}>
            Filters applied:
            {filters.budget_min && ` $${filters.budget_min}`}
            {filters.budget_max && `-$${filters.budget_max}`}
            {filters.commute_max && ` • ${filters.commute_max}min max`}
            {filters.room_type !== 'all' && ` • ${formatRoomType(filters.room_type)}`}
            {filters.shift !== 'all' && ` • ${filters.shift} shift`}
          </span>
          <button style={pageStyles.clearFilters} onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <main style={pageStyles.main}>
        {loading ? (
          <div style={pageStyles.loadingState}>
            <div style={pageStyles.spinner} />
            <p>Loading housing options...</p>
          </div>
        ) : (
          <>
            {/* Scarcity Alert */}
            {data?.scarcity && data.jobsite && (
              <ScarcityAlert
                scarcity={data.scarcity}
                jobsiteName={data.jobsite.name}
              />
            )}

            {/* Nearby Hubs Section */}
            <section style={pageStyles.section}>
              <h2 style={pageStyles.sectionTitle}>Nearby Areas</h2>
              <p style={pageStyles.sectionSubtitle}>
                Towns and neighborhoods ranked by housing availability
              </p>
              <div style={pageStyles.hubsGrid}>
                {data?.hubs.map((hub) => (
                  <HubTile
                    key={hub.hub_id}
                    hub={hub}
                    isSelected={selectedHub === hub.hub_id}
                    onClick={() =>
                      setSelectedHub(
                        selectedHub === hub.hub_id ? null : hub.hub_id
                      )
                    }
                  />
                ))}
                {data?.hubs.length === 0 && (
                  <p style={pageStyles.emptyState}>
                    No hubs found within your commute range. Try increasing the
                    max commute time.
                  </p>
                )}
              </div>
            </section>

            {/* Recent Listings Section */}
            <section style={pageStyles.section}>
              <div style={pageStyles.sectionHeader}>
                <div>
                  <h2 style={pageStyles.sectionTitle}>
                    {selectedHub
                      ? `Listings in ${data?.hubs.find((h) => h.hub_id === selectedHub)?.hub_name}`
                      : 'Recent Listings'}
                  </h2>
                  <p style={pageStyles.sectionSubtitle}>
                    {sortedListings.length} listings available
                    {selectedHub && (
                      <button
                        style={pageStyles.showAllButton}
                        onClick={() => setSelectedHub(null)}
                      >
                        Show all
                      </button>
                    )}
                  </p>
                </div>
              </div>

              {sortedListings.length > 0 ? (
                <div style={pageStyles.listingsGrid}>
                  {sortedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onClick={() => setSelectedListing(listing)}
                    />
                  ))}
                </div>
              ) : (
                <div style={pageStyles.emptyListings}>
                  <p style={pageStyles.emptyTitle}>No listings found</p>
                  <p style={pageStyles.emptyText}>
                    {selectedHub
                      ? 'Try selecting a different area or clearing the filter.'
                      : 'Be the first to post a listing for this jobsite!'}
                  </p>
                  <button
                    style={pageStyles.postCTA}
                    onClick={() => router.push('/design')}
                  >
                    + Post a Listing
                  </button>
                </div>
              )}
            </section>

            {/* Low Inventory CTA */}
            {data?.scarcity.is_scarce && (
              <section style={pageStyles.ctaSection}>
                <h3 style={pageStyles.ctaTitle}>
                  Help grow the community near {data?.jobsite?.name}
                </h3>
                <p style={pageStyles.ctaText}>
                  Housing is scarce near this jobsite. Post your listing or
                  wanted ad to help fellow tradeswomen find housing.
                </p>
                <div style={pageStyles.ctaButtons}>
                  <button
                    style={pageStyles.ctaButtonPrimary}
                    onClick={() => router.push('/design')}
                  >
                    Post a Listing
                  </button>
                  <button
                    style={pageStyles.ctaButtonSecondary}
                    onClick={() => alert('Coming soon: Wanted posts feature')}
                  >
                    Post a Wanted Ad
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Plan My Move Modal */}
      <PlanMyMoveModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        jobsite={data?.jobsite || null}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Listing Detail Drawer */}
      <ListingDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      {/* Footer */}
      <footer style={pageStyles.footer}>
        <p>© 2026 SiteSisters. All rights reserved.</p>
        <p style={pageStyles.footerTagline}>Built for women who build.</p>
      </footer>
    </div>
  )
}

const pageStyles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
  } as React.CSSProperties,
  header: {
    background: '#1e293b',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  } as React.CSSProperties,
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  backButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '0.95rem',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '6px',
  } as React.CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  logoIcon: {
    fontSize: '1.8rem',
  } as React.CSSProperties,
  logoText: {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  } as React.CSSProperties,
  hero: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    padding: '40px 24px',
    textAlign: 'center',
  } as React.CSSProperties,
  heroTitle: {
    color: 'white',
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '8px',
  } as React.CSSProperties,
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: '1rem',
    marginBottom: '20px',
  } as React.CSSProperties,
  planButton: {
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  filtersBar: {
    background: '#e0f2fe',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  filtersLabel: {
    fontSize: '0.9rem',
    color: '#0369a1',
  } as React.CSSProperties,
  clearFilters: {
    background: 'transparent',
    border: '1px solid #0369a1',
    color: '#0369a1',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  } as React.CSSProperties,
  loadingState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b',
  } as React.CSSProperties,
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#f97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  } as React.CSSProperties,
  section: {
    marginBottom: '32px',
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  } as React.CSSProperties,
  sectionSubtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  showAllButton: {
    background: 'transparent',
    border: 'none',
    color: '#f97316',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  } as React.CSSProperties,
  hubsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,
  listingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b',
    gridColumn: '1 / -1',
  } as React.CSSProperties,
  emptyListings: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  } as React.CSSProperties,
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '8px',
  } as React.CSSProperties,
  emptyText: {
    color: '#64748b',
    marginBottom: '20px',
  } as React.CSSProperties,
  postCTA: {
    background: '#f97316',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  ctaSection: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    color: 'white',
  } as React.CSSProperties,
  ctaTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '8px',
  } as React.CSSProperties,
  ctaText: {
    opacity: 0.9,
    marginBottom: '20px',
  } as React.CSSProperties,
  ctaButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  ctaButtonPrimary: {
    background: 'white',
    color: '#ea580c',
    border: 'none',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  ctaButtonSecondary: {
    background: 'transparent',
    color: 'white',
    border: '2px solid white',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  footer: {
    background: '#1e293b',
    padding: '32px 24px',
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: '40px',
  } as React.CSSProperties,
  footerTagline: {
    marginTop: '8px',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  } as React.CSSProperties,
}
