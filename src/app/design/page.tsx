'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { AddressAutocomplete, type AddressResult } from '@/components/AddressAutocomplete'
import { MapPin, Target, X, ChevronLeft, ChevronRight, Upload, Loader2, Building2 } from 'lucide-react'

// Types based on database schema
interface PosterProfile {
  id: string
  display_name: string
  company: string
  role: string | null
}

interface ListingPhoto {
  id: string
  listing_id: string
  storage_path: string
  sort_order: number
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
  // Joined data
  poster_profiles?: PosterProfile | null
  listing_photos?: ListingPhoto[]
  // Legacy fields for mock data compatibility
  cover_photo_url?: string | null
  photo_urls?: string[] | null
  profiles?: {
    display_name: string
  }
}

// Supabase client (anon key - safe for client-side)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Get public URL for a storage path
function getPhotoUrl(storagePath: string): string {
  if (!SUPABASE_URL) return ''
  return `${SUPABASE_URL}/storage/v1/object/public/listing-photos/${storagePath}`
}

async function fetchListings(filters: {
  city?: string
  rentMax?: number
  roomType?: string
}): Promise<Listing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return mock data if Supabase not configured
    return getMockListings()
  }

  let url = `${SUPABASE_URL}/rest/v1/listings?select=*,poster_profiles(*),listing_photos(*)&is_active=eq.true&order=created_at.desc`
  
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
    const data = await res.json()
    
    // Sort photos by sort_order
    return data.map((listing: Listing) => ({
      ...listing,
      listing_photos: listing.listing_photos?.sort((a, b) => a.sort_order - b.sort_order) || [],
    }))
  } catch {
    return getMockListings()
  }
}

function getMockListings(): Listing[] {
  return [
    {
      id: '1',
      user_id: 'user1',
      poster_profile_id: 'profile1',
      title: 'Cozy room near Intel Ocotillo',
      city: 'Phoenix, AZ',
      area: 'Downtown',
      rent_min: 800,
      rent_max: 1000,
      move_in: '2026-02-01',
      room_type: 'private_room',
      commute_area: 'Intel Ocotillo',
      details: 'Looking for a clean, quiet roommate. I work early shifts at the data center construction site. Non-smoker preferred.',
      tags: ['quiet', 'early-riser', 'non-smoker'],
      place_id: null,
      lat: null,
      lng: null,
      is_active: true,
      created_at: '2026-01-15T10:00:00Z',
      poster_profiles: {
        id: 'profile1',
        display_name: 'Sarah M.',
        company: 'Turner Construction',
        role: 'Electrician',
      },
      cover_photo_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
    },
    {
      id: '2',
      user_id: 'user2',
      poster_profile_id: 'profile2',
      title: 'Shared space near Samsung Taylor',
      city: 'Austin, TX',
      area: 'Round Rock',
      rent_min: 700,
      rent_max: 900,
      move_in: '2026-01-20',
      room_type: 'shared_room',
      commute_area: 'Samsung Taylor',
      details: 'Friendly electrician looking to share a 2BR apartment near the fab site. Flexible on move-in date.',
      tags: ['friendly', 'flexible'],
      place_id: null,
      lat: null,
      lng: null,
      is_active: true,
      created_at: '2026-01-14T15:30:00Z',
      poster_profiles: {
        id: 'profile2',
        display_name: 'Jessica R.',
        company: 'Skanska',
        role: 'Project Manager',
      },
      cover_photo_url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      ],
    },
    {
      id: '3',
      user_id: 'user3',
      poster_profile_id: 'profile3',
      title: 'Private room in New Albany',
      city: 'Columbus, OH',
      area: 'New Albany',
      rent_min: 650,
      rent_max: 850,
      move_in: '2026-02-15',
      room_type: 'private_room',
      commute_area: 'Intel Ohio',
      details: 'HVAC tech on a 6-month project. Looking for month-to-month or short-term lease. I keep odd hours but am respectful.',
      tags: ['short-term', 'flexible-hours'],
      place_id: null,
      lat: null,
      lng: null,
      is_active: true,
      created_at: '2026-01-13T09:00:00Z',
      poster_profiles: {
        id: 'profile3',
        display_name: 'Amanda K.',
        company: 'Mortenson',
        role: 'HVAC Tech',
      },
      cover_photo_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
      ],
    },
    {
      id: '4',
      user_id: 'user4',
      poster_profile_id: 'profile4',
      title: 'Entire 1BR near TSMC Arizona',
      city: 'Phoenix, AZ',
      area: 'Chandler',
      rent_min: 900,
      rent_max: 1100,
      move_in: '2026-03-01',
      room_type: 'entire_place',
      commute_area: 'TSMC Arizona',
      details: 'Have a whole 1BR available in a quiet complex. Perfect for someone who values privacy. Pool and gym access.',
      tags: ['privacy', 'amenities'],
      place_id: null,
      lat: null,
      lng: null,
      is_active: true,
      created_at: '2026-01-12T14:00:00Z',
      poster_profiles: {
        id: 'profile4',
        display_name: 'Michelle T.',
        company: 'Hensel Phelps',
        role: 'Site Supervisor',
      },
      cover_photo_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      photo_urls: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      ],
    },
  ]
}

function getListingCoverPhotoUrl(listing: Listing): string | null {
  // Try listing_photos first (from DB)
  if (listing.listing_photos && listing.listing_photos.length > 0) {
    return getPhotoUrl(listing.listing_photos[0].storage_path)
  }
  // Fall back to legacy mock data
  if (listing.cover_photo_url) return listing.cover_photo_url
  if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls[0]
  return null
}

function getListingPhotoUrls(listing: Listing): string[] {
  // Try listing_photos first (from DB)
  if (listing.listing_photos && listing.listing_photos.length > 0) {
    return listing.listing_photos.map(p => getPhotoUrl(p.storage_path))
  }
  // Fall back to legacy mock data
  if (listing.photo_urls) return listing.photo_urls
  if (listing.cover_photo_url) return [listing.cover_photo_url]
  return []
}

function getListingPhotoCount(listing: Listing): number {
  if (listing.listing_photos && listing.listing_photos.length > 0) {
    return listing.listing_photos.length
  }
  if (listing.photo_urls) return listing.photo_urls.length
  return listing.cover_photo_url ? 1 : 0
}

function getDisplayName(listing: Listing): string {
  if (listing.poster_profiles?.display_name) {
    return listing.poster_profiles.display_name
  }
  if (listing.profiles?.display_name) {
    return listing.profiles.display_name
  }
  return 'Anonymous'
}

function getCompany(listing: Listing): string | null {
  return listing.poster_profiles?.company || null
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

// Photo Carousel Component
function PhotoCarousel({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (photos.length === 0) {
    return (
      <div style={carouselStyles.placeholder}>
        <span>Photo coming soon</span>
      </div>
    )
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  return (
    <div style={carouselStyles.container}>
      <img
        src={photos[currentIndex]}
        alt={`Photo ${currentIndex + 1}`}
        style={carouselStyles.image}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            style={{ ...carouselStyles.navButton, left: '8px' }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            style={{ ...carouselStyles.navButton, right: '8px' }}
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </button>
          <div style={carouselStyles.dots}>
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  ...carouselStyles.dot,
                  ...(idx === currentIndex ? carouselStyles.dotActive : {}),
                }}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const carouselStyles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative',
    width: '100%',
    height: '240px',
    background: '#f1f5f9',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(51,65,85,0.9) 100%)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderRadius: '12px',
    marginBottom: '24px',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    color: '#1e293b',
  },
  dots: {
    position: 'absolute',
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  dotActive: {
    background: 'white',
  },
}

// Photo Uploader Component
function PhotoUploader({
  uploadedPaths,
  onUploadComplete,
  onRemove,
}: {
  uploadedPaths: string[]
  onUploadComplete: (paths: string[]) => void
  onRemove: (index: number) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = (node: HTMLInputElement | null) => {
    if (node) {
      node.value = ''
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setIsUploading(true)

    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      onUploadComplete([...uploadedPaths, ...data.paths])
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div style={uploaderStyles.container}>
      <div style={uploaderStyles.dropzone}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading || uploadedPaths.length >= 6}
          style={uploaderStyles.fileInput}
          id="photo-upload"
        />
        <label htmlFor="photo-upload" style={uploaderStyles.dropzoneLabel}>
          {isUploading ? (
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={24} />
          )}
          <span style={{ marginTop: '8px' }}>
            {isUploading
              ? 'Uploading...'
              : uploadedPaths.length >= 6
              ? 'Maximum 6 photos'
              : 'Drop photos here or click to select'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            JPG, PNG, or WebP • Max 6MB each
          </span>
        </label>
      </div>

      {error && <p style={uploaderStyles.error}>{error}</p>}

      {uploadedPaths.length > 0 && (
        <div style={uploaderStyles.previews}>
          {uploadedPaths.map((path, index) => (
            <div key={path} style={uploaderStyles.previewItem}>
              <img
                src={getPhotoUrl(path)}
                alt={`Upload ${index + 1}`}
                style={uploaderStyles.previewImage}
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                style={uploaderStyles.removeButton}
                aria-label="Remove photo"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const uploaderStyles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: '16px',
  },
  dropzone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    background: '#f8fafc',
  },
  dropzoneLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#64748b',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  error: {
    color: '#ef4444',
    fontSize: '0.85rem',
    marginTop: '8px',
  },
  previews: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '16px',
  },
  previewItem: {
    position: 'relative',
    width: '80px',
    height: '80px',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  removeButton: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
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
  
  // New listing form - organized by sections
  const [newListingProfile, setNewListingProfile] = useState({
    displayName: '',
    company: '',
    role: '',
  })
  
  const [newListingLocation, setNewListingLocation] = useState({
    address: '',
    city: '',
    area: '',
    placeId: '',
    lat: null as number | null,
    lng: null as number | null,
  })
  
  const [newListingDetails, setNewListingDetails] = useState({
    title: '',
    roomType: 'private_room',
    rentMin: '',
    rentMax: '',
    moveIn: '',
    commuteArea: '',
    tags: '',
    bio: '',
  })
  
  const [newListingPhotos, setNewListingPhotos] = useState<string[]>([])
  
  const [newListingContact, setNewListingContact] = useState({
    contactPreference: 'email',
    contactValue: '',
  })
  
  const [honeypot, setHoneypot] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function handlePostListingClick() {
    setShowPostModal(true)
  }

  function handleRequestIntroClick() {
    setShowIntroModal(true)
  }

  // Handle address selection from autocomplete
  function handleAddressSelect(result: AddressResult) {
    setNewListingLocation({
      address: result.formattedAddress,
      city: result.city,
      area: result.area,
      placeId: result.placeId,
      lat: result.lat || null,
      lng: result.lng || null,
    })
  }

  async function handlePostListing(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            displayName: newListingProfile.displayName,
            company: newListingProfile.company,
            role: newListingProfile.role || undefined,
            contactPreference: newListingContact.contactPreference,
            contactValue: newListingContact.contactValue,
          },
          listing: {
            title: newListingDetails.title || undefined,
            city: newListingLocation.city,
            area: newListingLocation.area || undefined,
            rentMin: newListingDetails.rentMin ? parseInt(newListingDetails.rentMin) : undefined,
            rentMax: newListingDetails.rentMax ? parseInt(newListingDetails.rentMax) : undefined,
            moveInISO: newListingDetails.moveIn || undefined,
            roomType: newListingDetails.roomType,
            commuteArea: newListingDetails.commuteArea || undefined,
            tags: newListingDetails.tags ? newListingDetails.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
            bio: newListingDetails.bio || undefined,
            placeId: newListingLocation.placeId || undefined,
            lat: newListingLocation.lat || undefined,
            lng: newListingLocation.lng || undefined,
          },
          photoPaths: newListingPhotos.length > 0 ? newListingPhotos : undefined,
          website: honeypot,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        alert(data.error || 'Failed to post listing')
        return
      }

      alert('Listing posted successfully!')
      setShowPostModal(false)
      
      // Reset form
      setNewListingProfile({ displayName: '', company: '', role: '' })
      setNewListingLocation({ address: '', city: '', area: '', placeId: '', lat: null, lng: null })
      setNewListingDetails({ title: '', roomType: 'private_room', rentMin: '', rentMax: '', moveIn: '', commuteArea: '', tags: '', bio: '' })
      setNewListingPhotos([])
      setNewListingContact({ contactPreference: 'email', contactValue: '' })
      setHoneypot('')
      
      loadListings()
    } catch (err) {
      console.error('Error posting listing:', err)
      alert('An error occurred while posting the listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRequestIntro(e: React.FormEvent) {
    e.preventDefault()
    // In production, this would POST to an API
    alert('Request sent! The listing owner will receive your message. (Demo mode)')
    setShowIntroModal(false)
    setIntroMessage('')
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
        <h1 style={styles.heroTitle}>A housing network for women who build.</h1>
        <p style={styles.heroSubhead}>
          Find roommates near construction and data center jobsites.
        </p>

        <p style={styles.heroTrustLine}>
          Private by default • Request-to-connect • Report + moderation
        </p>

        <div style={styles.heroCtas}>
          <a href="/jobsites" style={styles.primaryCta}>
            <Target
              aria-hidden="true"
              size={16}
              style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}
            />
            Plan my move
          </a>
          <a href="#listings" style={styles.secondaryCta}>
            <MapPin
              aria-hidden="true"
              size={16}
              style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}
            />
            Browse listings
          </a>
        </div>

        <p style={styles.heroMicrocopy}>
          No public contact info. Details shared only if you accept.
        </p>
      </section>

      {/* Hero follow-on */}
      <section style={styles.featureSection}>
        <div style={styles.featureInner}>
          <h2 style={styles.featureTitle}>
            Built for tough schedules and tougher housing markets.
          </h2>
          <div style={styles.filters}>
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
                  onChange={(e) =>
                    setRentMaxFilter(e.target.value ? parseInt(e.target.value) : '')
                  }
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
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section id="listings" style={styles.listingsSection}>
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

                  {getListingPhotoCount(listing) > 1 && (
                    <span style={styles.cardPhotoCount}>
                      {getListingPhotoCount(listing)} photos
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
                      Posted by {getDisplayName(listing)}
                      {getCompany(listing) && (
                        <span style={styles.cardCompany}>
                          {' '}• {getCompany(listing)}
                        </span>
                      )}
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
              {/* Photo Carousel */}
              <PhotoCarousel photos={getListingPhotoUrls(selectedListing)} />

              <h2 style={styles.drawerTitle}>
                {selectedListing.title || selectedListing.city}
              </h2>
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

              {selectedListing.tags && selectedListing.tags.length > 0 && (
                <div style={styles.tagsContainer}>
                  {selectedListing.tags.map((tag) => (
                    <span key={tag} style={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={styles.drawerDetails}>
                <h3 style={styles.detailsTitle}>About this listing</h3>
                <p style={styles.detailsText}>
                  {selectedListing.details || 'No additional details provided.'}
                </p>
              </div>

              {/* Profile Block */}
              <div style={styles.profileBlock}>
                <div style={styles.profileIcon}>
                  <Building2 size={20} />
                </div>
                <div style={styles.profileInfo}>
                  <span style={styles.profileName}>{getDisplayName(selectedListing)}</span>
                  {getCompany(selectedListing) && (
                    <span style={styles.profileCompany}>{getCompany(selectedListing)}</span>
                  )}
                  {selectedListing.poster_profiles?.role && (
                    <span style={styles.profileRole}>{selectedListing.poster_profiles.role}</span>
                  )}
                </div>
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
          <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setShowPostModal(false)}>
              <X aria-hidden="true" size={18} />
            </button>
            <h2 style={styles.modalTitle}>Post a Listing</h2>
            
            <form onSubmit={handlePostListing} style={styles.form}>
              {/* Honeypot - hidden from users */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Section 1: About You */}
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>About You</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah M."
                      value={newListingProfile.displayName}
                      onChange={(e) => setNewListingProfile({ ...newListingProfile, displayName: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Company *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Turner Construction"
                      value={newListingProfile.company}
                      onChange={(e) => setNewListingProfile({ ...newListingProfile, company: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Role/Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrician, Site Supervisor"
                    value={newListingProfile.role}
                    onChange={(e) => setNewListingProfile({ ...newListingProfile, role: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>

              {/* Section 2: Location */}
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Location</h3>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Address</label>
                  <AddressAutocomplete
                    onSelect={handleAddressSelect}
                    placeholder="Start typing an address..."
                  />
                  <p style={styles.formHint}>
                    Select an address to auto-fill city and area below
                  </p>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phoenix, AZ"
                      value={newListingLocation.city}
                      onChange={(e) => setNewListingLocation({ ...newListingLocation, city: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Area/Neighborhood</label>
                    <input
                      type="text"
                      placeholder="e.g. Downtown, Chandler"
                      value={newListingLocation.area}
                      onChange={(e) => setNewListingLocation({ ...newListingLocation, area: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Listing Details */}
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Listing Details</h3>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Listing Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cozy room near Intel Ocotillo"
                    value={newListingDetails.title}
                    onChange={(e) => setNewListingDetails({ ...newListingDetails, title: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Room Type *</label>
                    <select
                      required
                      value={newListingDetails.roomType}
                      onChange={(e) => setNewListingDetails({ ...newListingDetails, roomType: e.target.value })}
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
                      value={newListingDetails.moveIn}
                      onChange={(e) => setNewListingDetails({ ...newListingDetails, moveIn: e.target.value })}
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
                      value={newListingDetails.rentMin}
                      onChange={(e) => setNewListingDetails({ ...newListingDetails, rentMin: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Max Rent ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={newListingDetails.rentMax}
                      onChange={(e) => setNewListingDetails({ ...newListingDetails, rentMax: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Commute Area / Job Site</label>
                  <input
                    type="text"
                    placeholder="e.g. Intel Ocotillo, TSMC Arizona"
                    value={newListingDetails.commuteArea}
                    onChange={(e) => setNewListingDetails({ ...newListingDetails, commuteArea: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. quiet, early-riser, non-smoker"
                    value={newListingDetails.tags}
                    onChange={(e) => setNewListingDetails({ ...newListingDetails, tags: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Description</label>
                  <textarea
                    placeholder="Tell potential roommates about yourself, your schedule, preferences, etc."
                    value={newListingDetails.bio}
                    onChange={(e) => setNewListingDetails({ ...newListingDetails, bio: e.target.value })}
                    style={styles.formTextarea}
                    rows={4}
                  />
                </div>
              </div>

              {/* Section 4: Photos */}
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Photos</h3>
                <PhotoUploader
                  uploadedPaths={newListingPhotos}
                  onUploadComplete={setNewListingPhotos}
                  onRemove={(index) => {
                    setNewListingPhotos(prev => prev.filter((_, i) => i !== index))
                  }}
                />
              </div>

              {/* Section 5: Contact (Private) */}
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Contact Info (Private)</h3>
                <p style={styles.formHint}>
                  This information is only shared when you accept an intro request.
                </p>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Contact Method *</label>
                    <select
                      required
                      value={newListingContact.contactPreference}
                      onChange={(e) => setNewListingContact({ ...newListingContact, contactPreference: e.target.value })}
                      style={styles.formSelect}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="instagram">Instagram</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      {newListingContact.contactPreference === 'email' ? 'Email Address' :
                       newListingContact.contactPreference === 'phone' ? 'Phone Number' :
                       newListingContact.contactPreference === 'instagram' ? 'Instagram Handle' :
                       'Contact Info'} *
                    </label>
                    <input
                      type={newListingContact.contactPreference === 'email' ? 'email' : 'text'}
                      required
                      placeholder={
                        newListingContact.contactPreference === 'email' ? 'you@example.com' :
                        newListingContact.contactPreference === 'phone' ? '(555) 555-5555' :
                        newListingContact.contactPreference === 'instagram' ? '@username' :
                        'Your contact info'
                      }
                      value={newListingContact.contactValue}
                      onChange={(e) => setNewListingContact({ ...newListingContact, contactValue: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Listing'}
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
              Send an intro request to {getDisplayName(selectedListing)}. 
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

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
  },
  hero: {
    background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
    padding: '48px 24px 40px',
    textAlign: 'center',
  },
  heroTitle: {
    color: 'white',
    fontSize: '2.25rem',
    fontWeight: 700,
    marginBottom: '12px',
    maxWidth: '700px',
    margin: '0 auto 12px',
    lineHeight: 1.2,
  },
  heroSubhead: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '1.1rem',
    maxWidth: '520px',
    margin: '0 auto',
    lineHeight: 1.5,
  },
  heroTrustLine: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.85rem',
    marginTop: '16px',
    letterSpacing: '0.02em',
  },
  heroCtas: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '24px',
  },
  primaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0d9488',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'background 0.2s',
    minWidth: '160px',
  },
  secondaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    color: 'rgba(255,255,255,0.9)',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'background 0.2s',
    minWidth: '160px',
  },
  heroMicrocopy: {
    marginTop: '16px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    maxWidth: '420px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.4,
  },
  featureSection: {
    background: '#f8fafc',
    padding: '32px 24px 24px',
  },
  featureInner: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  featureTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: '0',
  },
  filters: {
    background: 'white',
    padding: '24px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    marginTop: '24px',
  },
  filterRow: {
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
    background: '#0d9488',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
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
  cardCompany: {
    color: '#64748b',
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
    zIndex: 10,
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
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  },
  tag: {
    background: '#e0f2fe',
    color: '#0369a1',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '0.8rem',
    fontWeight: 500,
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
  profileBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '24px',
    borderTop: '1px solid #e2e8f0',
  },
  profileIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#0d9488',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  profileName: {
    fontWeight: 600,
    color: '#1e293b',
    fontSize: '1rem',
  },
  profileCompany: {
    color: '#64748b',
    fontSize: '0.9rem',
  },
  profileRole: {
    color: '#94a3b8',
    fontSize: '0.85rem',
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
    background: '#0d9488',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
  },
  reportButton: {
    background: 'transparent',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '12px 16px',
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
  modalLarge: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '680px',
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
  formSection: {
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  formSectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e2e8f0',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px',
  },
  formLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
  },
  formHint: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '4px',
    marginBottom: '8px',
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
    background: '#0d9488',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  reportSubmitButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: {
    background: '#020617',
    padding: '28px 24px',
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: '48px',
  },
  footerTagline: {
    marginTop: '8px',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
}
