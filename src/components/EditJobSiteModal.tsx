'use client'

import * as React from 'react'
import { X, Loader2, MapPin, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserJobSite, UpdateUserJobSiteInput } from '@/lib/supabase'

// US state abbreviations for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington DC' },
]

interface EditJobSiteModalProps {
  jobSite: UserJobSite | null
  open: boolean
  onClose: () => void
  onSuccess: (jobSite: UserJobSite) => void
}

export function EditJobSiteModal({ jobSite, open, onClose, onSuccess }: EditJobSiteModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Form state
  const [formData, setFormData] = React.useState<UpdateUserJobSiteInput>({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })

  // Initialize form data when job site changes
  React.useEffect(() => {
    if (jobSite) {
      setFormData({
        name: jobSite.name,
        address_line1: jobSite.address_line1,
        address_line2: jobSite.address_line2 || '',
        city: jobSite.city,
        state: jobSite.state,
        zip: jobSite.zip,
        notes: jobSite.notes || '',
      })
    }
  }, [jobSite])

  // Lock body scroll when modal is open
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

  // Form validation
  const isValid = React.useMemo(() => {
    return (
      formData.name?.trim() !== '' &&
      formData.address_line1?.trim() !== '' &&
      formData.city?.trim() !== '' &&
      formData.state?.trim() !== '' &&
      /^\d{5}(-\d{4})?$/.test(formData.zip?.trim() || '')
    )
  }, [formData])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValid || isSubmitting || !jobSite) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/user-job-sites/${jobSite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setError(data.error || 'Failed to update job site')
        return
      }

      onSuccess(data.jobSite)
      onClose()
    } catch (err) {
      console.error('Error updating job site:', err)
      setError('An error occurred while updating the job site')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!open || !jobSite) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Edit job site"
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
              <MapPin className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Edit Job Site</h2>
              <p className="text-sm text-white/60">Update project location</p>
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

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div ref={contentRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="space-y-5">
              {/* Error display */}
              {error && (
                <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Job Site Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white/90">
                  Job Site Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Smith Bathroom Remodel"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  required
                />
              </div>

              {/* Address Line 1 */}
              <div className="space-y-2">
                <Label htmlFor="address_line1" className="text-sm font-medium text-white/90">
                  Address Line 1 <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  type="text"
                  placeholder="e.g., 123 Main Street"
                  value={formData.address_line1 || ''}
                  onChange={handleInputChange}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                  required
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2">
                <Label htmlFor="address_line2" className="text-sm font-medium text-white/90">
                  Address Line 2
                </Label>
                <Input
                  id="address_line2"
                  name="address_line2"
                  type="text"
                  placeholder="e.g., Suite 100, Apt 2B"
                  value={formData.address_line2 || ''}
                  onChange={handleInputChange}
                  className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                />
              </div>

              {/* City, State, ZIP row */}
              <div className="grid grid-cols-6 gap-3">
                {/* City */}
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-white/90">
                    City <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                    required
                  />
                </div>

                {/* State */}
                <div className="col-span-1.5 space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-white/90">
                    State <span className="text-red-400">*</span>
                  </Label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleInputChange}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-base text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    required
                  >
                    <option value="" className="bg-slate-900">Select</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value} className="bg-slate-900">
                        {state.value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ZIP */}
                <div className="col-span-1.5 space-y-2">
                  <Label htmlFor="zip" className="text-sm font-medium text-white/90">
                    ZIP <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="zip"
                    name="zip"
                    type="text"
                    placeholder="12345"
                    maxLength={10}
                    value={formData.zip || ''}
                    onChange={handleInputChange}
                    className="h-12 border-white/10 bg-white/5 text-base text-white placeholder:text-white/40"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-white/90">
                  Notes
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes about this job site..."
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>

          {/* Footer with submit button */}
          <div className="border-t border-white/10 p-4 pb-safe sm:p-6">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="h-12 w-full bg-orange-600 text-base font-semibold text-white hover:bg-orange-500 disabled:opacity-50 sm:h-14"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
