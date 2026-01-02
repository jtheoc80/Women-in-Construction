'use client'

import { useState } from 'react'
import { useGatedAction, useAuth } from '@/contexts/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ListingPhotoGallery } from '@/components/PhotoGallery'
import { X, Sun, Sunrise, Moon } from 'lucide-react'

// Helper functions
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Flexible'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Styles
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
    fontFamily: 'inherit',
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

// Loose typing for Listing to support different data shapes
interface DrawerListing {
  id: string
  user_id: string
  city: string
  area?: string | null
  rent_min?: number | null
  rent_max?: number | null
  room_type: string
  move_in?: string | null
  shift?: string | null
  details?: string | null
  profiles?: { display_name: string }
  poster_profiles?: { display_name: string } | null
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  is_demo?: boolean
}

export function ListingDrawer({
  listing,
  onClose,
}: {
  listing: DrawerListing | null
  onClose: () => void
}) {
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [introMessage, setIntroMessage] = useState('')
  const { gateAction } = useGatedAction()
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  if (!listing) return null

  const displayName = listing.poster_profiles?.display_name || listing.profiles?.display_name || 'Anonymous'

  const handleRequestIntroClick = () => {
    gateAction(() => setShowIntroModal(true))
  }

  const handleRequestIntro = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Please sign in to request an intro')
      return
    }

    try {
      const { error } = await supabase
        .from('listing_requests')
        .insert({
          listing_id: listing.id,
          from_user_id: user.id,
          to_user_id: listing.user_id,
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

  return (
    <div style={drawerStyles.overlay} onClick={onClose}>
      <div style={drawerStyles.drawer} onClick={(e) => e.stopPropagation()}>
        <button style={drawerStyles.closeButton} onClick={onClose}>
          <X aria-hidden="true" size={18} />
        </button>

        {/* Photo Gallery with full mobile support */}
        <ListingPhotoGallery listing={listing} />

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
                {formatDate(listing.move_in || null)}
              </span>
            </div>
            {listing.shift && (
              <div style={drawerStyles.metaItem}>
                <span style={drawerStyles.metaLabel}>Shift</span>
                <span style={drawerStyles.metaValue}>
                  {listing.shift === 'day' && (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Sun aria-hidden="true" size={14} />
                      Day
                    </span>
                  )}
                  {listing.shift === 'swing' && (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Sunrise aria-hidden="true" size={14} />
                      Swing
                    </span>
                  )}
                  {listing.shift === 'night' && (
                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Moon aria-hidden="true" size={14} />
                      Night
                    </span>
                  )}
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
            <strong>{displayName}</strong>
          </div>

          <button
            style={drawerStyles.introButton}
            onClick={handleRequestIntroClick}
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
              <X aria-hidden="true" size={18} />
            </button>
            <h2 style={modalStyles.title}>Request an Introduction</h2>
            <p style={modalStyles.subtitle}>
              Send an intro request to{' '}
              {displayName}. If they accept,
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
