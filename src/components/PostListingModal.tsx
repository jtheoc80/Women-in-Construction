'use client'

import * as React from 'react'
import { X, ChevronLeft, ChevronRight, Upload, Loader2, Lock, Check, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddressAutocomplete, type AddressResult } from '@/components/AddressAutocomplete'
import { useAuth } from '@/contexts/AuthContext'
import { ListingImage } from '@/components/ListingImage'

// Constants
const MAX_PHOTOS = 6
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (before webp conversion)

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === currentStep
              ? 'w-8 bg-teal-500'
              : i < currentStep
              ? 'w-2 bg-teal-500/60'
              : 'w-2 bg-white/20'
          }`}
        />
      ))}
    </div>
  )
}

// Types
interface ProfileData {
  displayName: string
  company: string
  role: string
}

interface LocationData {
  address: string
  city: string
  area: string
  placeId: string
  lat: number | null
  lng: number | null
}

interface ListingData {
  title: string
  roomType: string
  rentMin: string
  rentMax: string
  moveIn: string
  commuteArea: string
  tags: string
  bio: string
}

interface ContactData {
  contactPreference: string
  contactValue: string
}

interface PostListingModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PostListingModal({ open, onClose, onSuccess }: PostListingModalProps) {
  const { profile } = useAuth()
  const [step, setStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Form state
  const [profileData, setProfileData] = React.useState<ProfileData>({
    displayName: '',
    company: '',
    role: '',
  })

  const [locationData, setLocationData] = React.useState<LocationData>({
    address: '',
    city: '',
    area: '',
    placeId: '',
    lat: null,
    lng: null,
  })

  const [listingData, setListingData] = React.useState<ListingData>({
    title: '',
    roomType: 'private_room',
    rentMin: '',
    rentMax: '',
    moveIn: '',
    commuteArea: '',
    tags: '',
    bio: '',
  })

  const [photos, setPhotos] = React.useState<string[]>([])
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  const [contactData, setContactData] = React.useState<ContactData>({
    contactPreference: 'email',
    contactValue: '',
  })

  const [honeypot, setHoneypot] = React.useState('')

  const STEPS = [
    { title: 'About You', description: 'Tell us about yourself' },
    { title: 'Location', description: 'Where is the listing?' },
    { title: 'Details', description: 'Describe the space' },
    { title: 'Photos', description: 'Add photos' },
    { title: 'Contact', description: 'How to reach you' },
  ]

  // Pre-fill display name from auth profile
  React.useEffect(() => {
    if (open && profile) {
      setProfileData(prev => ({
        ...prev,
        displayName: prev.displayName || profile.display_name || profile.first_name || '',
        // company and role are collected fresh for each listing
      }))
    }
  }, [open, profile])

  // Lock body scroll
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // ESC to close
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Scroll to top on step change
  React.useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
  }, [step])

  // Validation
  const canProceed = (currentStep: number): boolean => {
    switch (currentStep) {
      case 0: // About you
        return profileData.displayName.trim() !== '' && profileData.company.trim() !== ''
      case 1: // Location
        return locationData.city.trim() !== ''
      case 2: // Details
        return listingData.roomType !== ''
      case 3: // Photos
        return true // Photos are optional
      case 4: // Contact
        return contactData.contactValue.trim() !== ''
      default:
        return false
    }
  }

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    
    // Check file count
    if (photos.length + files.length > MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    // Check file sizes
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File "${file.name}" exceeds 6MB limit`)
        return
      }
    }

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
        setUploadError(data.error || 'Upload failed')
        return
      }

      setPhotos(prev => [...prev, ...data.paths])
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Address selection handler
  const handleAddressSelect = (result: AddressResult) => {
    setLocationData({
      address: result.formattedAddress,
      city: result.city,
      area: result.area,
      placeId: result.placeId,
      lat: result.lat || null,
      lng: result.lng || null,
    })
  }

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            displayName: profileData.displayName,
            company: profileData.company,
            role: profileData.role || undefined,
            contactPreference: contactData.contactPreference,
            contactValue: contactData.contactValue,
          },
          listing: {
            title: listingData.title || undefined,
            city: locationData.city,
            area: locationData.area || undefined,
            rentMin: listingData.rentMin ? parseInt(listingData.rentMin) : undefined,
            rentMax: listingData.rentMax ? parseInt(listingData.rentMax) : undefined,
            moveInISO: listingData.moveIn || undefined,
            roomType: listingData.roomType,
            commuteArea: listingData.commuteArea || undefined,
            tags: listingData.tags ? listingData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
            bio: listingData.bio || undefined,
            placeId: locationData.placeId || undefined,
            lat: locationData.lat || undefined,
            lng: locationData.lng || undefined,
            fullAddress: locationData.address || undefined,
          },
          photoPaths: photos.length > 0 ? photos : undefined,
          website: honeypot,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        alert(data.error || 'Failed to post listing')
        return
      }

      // Success - reset form and close
      resetForm()
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error posting listing:', err)
      alert('An error occurred while posting the listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(0)
    setProfileData({ displayName: '', company: '', role: '' })
    setLocationData({ address: '', city: '', area: '', placeId: '', lat: null, lng: null })
    setListingData({ title: '', roomType: 'private_room', rentMin: '', rentMax: '', moveIn: '', commuteArea: '', tags: '', bio: '' })
    setPhotos([])
    setContactData({ contactPreference: 'email', contactValue: '' })
    setHoneypot('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Post a listing"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative flex h-[95dvh] w-full flex-col rounded-t-3xl bg-slate-900 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl">
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">{STEPS[step].title}</h2>
              <p className="text-sm text-white/60">{STEPS[step].description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="border-b border-white/10 py-3">
          <StepIndicator currentStep={step} totalSteps={STEPS.length} />
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Step 0: About You */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-white/90">
                  Your Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="e.g. Sarah M."
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-white/90">
                  Company <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="e.g. Turner Construction"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-white/90">
                  Role/Title
                </Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="e.g. Electrician, Site Supervisor"
                  value={profileData.role}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Lock className="h-4 w-4" />
                  Address (Private)
                </Label>
                <AddressAutocomplete
                  onSelect={handleAddressSelect}
                  placeholder="Start typing an address..."
                />
                <p className="flex items-start gap-2 rounded-xl bg-teal-500/10 p-3 text-xs text-teal-400">
                  <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  Your full address is kept private. Others will only see the city and neighborhood.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-white/90">
                  City <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="e.g. Phoenix, AZ"
                  value={locationData.city}
                  onChange={(e) => setLocationData({ ...locationData, city: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm font-medium text-white/90">
                  Area/Neighborhood
                </Label>
                <Input
                  id="area"
                  type="text"
                  placeholder="e.g. Downtown, Chandler"
                  value={locationData.area}
                  onChange={(e) => setLocationData({ ...locationData, area: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-white/90">
                  Listing Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g. Cozy room near Intel Ocotillo"
                  value={listingData.title}
                  onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomType" className="text-sm font-medium text-white/90">
                  Room Type <span className="text-red-400">*</span>
                </Label>
                <select
                  id="roomType"
                  value={listingData.roomType}
                  onChange={(e) => setListingData({ ...listingData, roomType: e.target.value })}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  required
                >
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                  <option value="entire_place">Entire Place</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentMin" className="text-sm font-medium text-white/90">
                    Min Rent ($)
                  </Label>
                  <Input
                    id="rentMin"
                    type="number"
                    placeholder="700"
                    value={listingData.rentMin}
                    onChange={(e) => setListingData({ ...listingData, rentMin: e.target.value })}
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rentMax" className="text-sm font-medium text-white/90">
                    Max Rent ($)
                  </Label>
                  <Input
                    id="rentMax"
                    type="number"
                    placeholder="1000"
                    value={listingData.rentMax}
                    onChange={(e) => setListingData({ ...listingData, rentMax: e.target.value })}
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveIn" className="text-sm font-medium text-white/90">
                  Move-in Date
                </Label>
                <Input
                  id="moveIn"
                  type="date"
                  value={listingData.moveIn}
                  onChange={(e) => setListingData({ ...listingData, moveIn: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commuteArea" className="text-sm font-medium text-white/90">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Commute Area / Job Site
                </Label>
                <Input
                  id="commuteArea"
                  type="text"
                  placeholder="e.g. Intel Ocotillo, TSMC Arizona"
                  value={listingData.commuteArea}
                  onChange={(e) => setListingData({ ...listingData, commuteArea: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-white/90">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="quiet, early-riser, non-smoker"
                  value={listingData.tags}
                  onChange={(e) => setListingData({ ...listingData, tags: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-white/90">
                  Description
                </Label>
                <textarea
                  id="bio"
                  placeholder="Tell potential roommates about yourself, your schedule, preferences, etc."
                  value={listingData.bio}
                  onChange={(e) => setListingData({ ...listingData, bio: e.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-white/20 p-6 text-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={isUploading || photos.length >= MAX_PHOTOS}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`flex flex-col items-center ${
                      isUploading || photos.length >= MAX_PHOTOS ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                    ) : (
                      <Upload className="h-8 w-8 text-white/60" />
                    )}
                    <span className="mt-3 text-sm text-white/70">
                      {isUploading
                        ? 'Uploading...'
                        : photos.length >= MAX_PHOTOS
                        ? `Maximum ${MAX_PHOTOS} photos`
                        : 'Drop photos here or tap to select'}
                    </span>
                    <span className="mt-1 text-xs text-white/50">
                      JPG, PNG, WebP, GIF • Max 10MB each (auto-converted to WebP)
                    </span>
                  </label>
                </div>

                {uploadError && (
                  <p className="text-sm text-red-400">{uploadError}</p>
                )}

                {/* Photo previews */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((path, index) => (
                      <div key={path} className="relative overflow-hidden rounded-xl">
                        <ListingImage
                          src={path}
                          alt={`Upload ${index + 1}`}
                          aspectRatio="1/1"
                          sizes="120px"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
                          aria-label="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-xl bg-teal-500/10 p-4">
                <p className="text-sm text-teal-400">
                  This information is only shared when you accept an intro request.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPreference" className="text-sm font-medium text-white/90">
                  Contact Method <span className="text-red-400">*</span>
                </Label>
                <select
                  id="contactPreference"
                  value={contactData.contactPreference}
                  onChange={(e) => setContactData({ ...contactData, contactPreference: e.target.value })}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  required
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="instagram">Instagram</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactValue" className="text-sm font-medium text-white/90">
                  {contactData.contactPreference === 'email' && 'Email Address'}
                  {contactData.contactPreference === 'phone' && 'Phone Number'}
                  {contactData.contactPreference === 'instagram' && 'Instagram Handle'}
                  {contactData.contactPreference === 'other' && 'Contact Info'}
                  <span className="text-red-400"> *</span>
                </Label>
                <Input
                  id="contactValue"
                  type={contactData.contactPreference === 'email' ? 'email' : 'text'}
                  placeholder={
                    contactData.contactPreference === 'email' ? 'you@example.com' :
                    contactData.contactPreference === 'phone' ? '(555) 555-5555' :
                    contactData.contactPreference === 'instagram' ? '@username' :
                    'Your contact info'
                  }
                  value={contactData.contactValue}
                  onChange={(e) => setContactData({ ...contactData, contactValue: e.target.value })}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with action button */}
        <div className="border-t border-white/10 p-4 pb-safe sm:p-6">
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed(step)}
              className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
            >
              Continue
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed(step) || isSubmitting}
              className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500 disabled:opacity-50 sm:h-14"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Post Listing
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
