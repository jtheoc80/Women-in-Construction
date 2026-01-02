'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Jobsite, UserJobSite } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { useAuth, useGatedAction } from '@/contexts/AuthContext'
import { NewJobSiteModal } from '@/components/NewJobSiteModal'
import { EditJobSiteModal } from '@/components/EditJobSiteModal'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Building2,
  Factory,
  HardHat,
  LoaderCircle,
  Search,
  Plus,
  MapPin,
  Calendar,
  MoreHorizontal,
  Archive,
  Trash2,
  Pencil,
} from 'lucide-react'

export default function JobsitesIndexPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { gateAction } = useGatedAction()
  
  // Public jobsites state
  const [jobsites, setJobsites] = useState<Jobsite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // User job sites state
  const [userJobSites, setUserJobSites] = useState<UserJobSite[]>([])
  const [userJobSitesLoading, setUserJobSitesLoading] = useState(false)
  
  // Modal state
  const [showNewJobSiteModal, setShowNewJobSiteModal] = useState(false)
  const [editingJobSite, setEditingJobSite] = useState<UserJobSite | null>(null)
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // Load public jobsites
  useEffect(() => {
    async function loadJobsites() {
      try {
        const response = await fetch('/api/jobsites')
        if (response.ok) {
          const data = await response.json()
          setJobsites(data)
        }
      } catch (error) {
        console.error('Error loading jobsites:', error)
      } finally {
        setLoading(false)
      }
    }
    loadJobsites()
  }, [])

  // Load user job sites when user is authenticated
  const loadUserJobSites = useCallback(async () => {
    if (!user) {
      setUserJobSites([])
      return
    }
    
    setUserJobSitesLoading(true)
    try {
      const response = await fetch('/api/user-job-sites')
      if (response.ok) {
        const data = await response.json()
        // Handle both array response and error response
        if (Array.isArray(data)) {
          setUserJobSites(data)
        } else {
          setUserJobSites([])
        }
      }
    } catch (error) {
      console.error('Error loading user job sites:', error)
    } finally {
      setUserJobSitesLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUserJobSites()
  }, [loadUserJobSites])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null)
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  // Group public jobsites by state
  const groupedJobsites = jobsites.reduce(
    (acc, jobsite) => {
      const state = jobsite.state
      if (!acc[state]) {
        acc[state] = []
      }
      acc[state].push(jobsite)
      return acc
    },
    {} as Record<string, Jobsite[]>
  )

  // Filter by search query
  const filteredJobsites = searchQuery
    ? jobsites.filter(
        (j) =>
          j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.operator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.county_or_parish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.nearest_town?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobsites

  const handlePostListing = () => {
    gateAction(() => router.push('/browse'))
  }

  const handleNewJobSite = () => {
    gateAction(() => setShowNewJobSiteModal(true))
  }

  const handleJobSiteCreated = (jobSite: UserJobSite) => {
    setUserJobSites((prev) => [jobSite, ...prev])
  }

  const handleJobSiteUpdated = (updatedJobSite: UserJobSite) => {
    setUserJobSites((prev) =>
      prev.map((js) => (js.id === updatedJobSite.id ? updatedJobSite : js))
    )
  }

  const handleEditJobSite = (jobSite: UserJobSite) => {
    setEditingJobSite(jobSite)
    setOpenDropdownId(null)
  }

  const handleArchiveJobSite = async (id: string) => {
    try {
      const response = await fetch(`/api/user-job-sites/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setUserJobSites((prev) => prev.filter((js) => js.id !== id))
      }
    } catch (error) {
      console.error('Error archiving job site:', error)
    }
    setOpenDropdownId(null)
  }

  const handleDeleteJobSite = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this job site?')) {
      return
    }
    try {
      const response = await fetch(`/api/user-job-sites/${id}?hard=true`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setUserJobSites((prev) => prev.filter((js) => js.id !== id))
      }
    } catch (error) {
      console.error('Error deleting job site:', error)
    }
    setOpenDropdownId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAddress = (jobSite: UserJobSite) => {
    return `${jobSite.address_line1}${jobSite.address_line2 ? `, ${jobSite.address_line2}` : ''}, ${jobSite.city}, ${jobSite.state} ${jobSite.zip}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onPostListing={handlePostListing} />

      {/* Header */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Job Sites
          </h1>
          <p className="mt-3 text-base text-white/70">
            Manage your project locations or explore major construction sites
          </p>
        </div>
      </section>

      {/* My Job Sites Section (authenticated users only) */}
      {user && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">My Job Sites</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your saved project locations for generating proposals
                </p>
              </div>
              <Button
                onClick={handleNewJobSite}
                className="bg-orange-600 text-white hover:bg-orange-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Job Site
              </Button>
            </div>

            {userJobSitesLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600">
                <LoaderCircle className="h-6 w-6 animate-spin text-orange-500" />
                <p className="text-sm">Loading your job sites...</p>
              </div>
            ) : userJobSites.length === 0 ? (
              // Empty state
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">No job sites yet</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create one to start generating proposals faster.
                </p>
                <Button
                  onClick={handleNewJobSite}
                  className="mt-4 bg-orange-600 text-white hover:bg-orange-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Job Site
                </Button>
              </div>
            ) : (
              // Job sites table/grid
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Desktop table view */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userJobSites.map((jobSite) => (
                        <tr
                          key={jobSite.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                <MapPin className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{jobSite.name}</p>
                                {jobSite.notes && (
                                  <p className="line-clamp-1 text-sm text-slate-500">
                                    {jobSite.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-600">{formatAddress(jobSite)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                              <Calendar className="h-4 w-4" />
                              {formatDate(jobSite.created_at)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdownId(
                                    openDropdownId === jobSite.id ? null : jobSite.id
                                  )
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                              {openDropdownId === jobSite.id && (
                                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                  <button
                                    onClick={() => handleEditJobSite(jobSite)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    View / Edit
                                  </button>
                                  <button
                                    onClick={() => handleArchiveJobSite(jobSite.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Archive className="h-4 w-4" />
                                    Archive
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJobSite(jobSite.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {userJobSites.map((jobSite) => (
                    <div key={jobSite.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                            <MapPin className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{jobSite.name}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {jobSite.city}, {jobSite.state} {jobSite.zip}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(jobSite.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdownId(
                                openDropdownId === jobSite.id ? null : jobSite.id
                              )
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          {openDropdownId === jobSite.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                              <button
                                onClick={() => handleEditJobSite(jobSite)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Pencil className="h-4 w-4" />
                                View / Edit
                              </button>
                              <button
                                onClick={() => handleArchiveJobSite(jobSite.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </button>
                              <button
                                onClick={() => handleDeleteJobSite(jobSite.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Explore Public Jobsites Section */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Explore Major Construction Sites
          </h2>
          <label htmlFor="jobsite-search" className="sr-only">
            Search jobsites
          </label>
          <div className="relative mx-auto max-w-2xl">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="jobsite-search"
              type="text"
              placeholder="Search by jobsite name, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
            <LoaderCircle className="h-6 w-6 animate-spin text-indigo-500" />
            <p className="text-sm">Loading jobsites...</p>
          </div>
        ) : searchQuery ? (
          // Search Results
          <section className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Search Results{' '}
              <span className="font-normal text-slate-500">
                ({filteredJobsites.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredJobsites.map((jobsite) => (
                <JobsiteCard
                  key={jobsite.id}
                  jobsite={jobsite}
                  onClick={() => router.push(`/jobsites/${jobsite.slug}`)}
                />
              ))}
              {filteredJobsites.length === 0 && (
                <p className="col-span-full py-12 text-center text-slate-600">
                  No jobsites found matching &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
          </section>
        ) : (
          // Grouped by State
          <div className="space-y-10">
            {Object.entries(groupedJobsites)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, stateJobsites]) => (
                <section key={state} className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {stateNames[state] || state}
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {stateJobsites.map((jobsite) => (
                      <JobsiteCard
                        key={jobsite.id}
                        jobsite={jobsite}
                        onClick={() => router.push(`/jobsites/${jobsite.slug}`)}
                      />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <p className="text-sm text-white/70">
            © 2026 SiteSisters. All rights reserved.
          </p>
          <p className="mt-2 text-sm text-white/60">Built for women who build.</p>
        </div>
      </footer>

      {/* New Job Site Modal */}
      <NewJobSiteModal
        open={showNewJobSiteModal}
        onClose={() => setShowNewJobSiteModal(false)}
        onSuccess={handleJobSiteCreated}
      />

      {/* Edit Job Site Modal */}
      <EditJobSiteModal
        jobSite={editingJobSite}
        open={editingJobSite !== null}
        onClose={() => setEditingJobSite(null)}
        onSuccess={handleJobSiteUpdated}
      />
    </div>
  )
}

// State name lookup
const stateNames: Record<string, string> = {
  AZ: 'Arizona',
  TX: 'Texas',
  OH: 'Ohio',
  NY: 'New York',
  ID: 'Idaho',
  VA: 'Virginia',
  AL: 'Alabama',
  AK: 'Alaska',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  UT: 'Utah',
  VT: 'Vermont',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'Washington DC',
}

// Jobsite Card Component for public jobsites
function JobsiteCard({
  jobsite,
  onClick,
}: {
  jobsite: Jobsite
  onClick: () => void
}) {
  const Icon = getJobsiteIcon(jobsite)
  const isActiveBuild = jobsite.status === 'active_build'
  
  // Format location string
  const locationParts = []
  if (jobsite.nearest_town || jobsite.city) {
    locationParts.push(jobsite.nearest_town || jobsite.city)
  }
  if (jobsite.county_or_parish) {
    locationParts.push(jobsite.county_or_parish)
  }
  locationParts.push(jobsite.state)
  const locationString = locationParts.join(', ')
  
  return (
    <button
      onClick={onClick}
      aria-label={`View jobsite: ${jobsite.name}`}
      className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900">
            {jobsite.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {locationString}
          </p>
          
          {/* Operator chip and status badge */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {jobsite.operator && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {jobsite.operator}
              </span>
            )}
            {isActiveBuild && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                🚧 Active Build
              </span>
            )}
            {jobsite.project_type && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {jobsite.project_type}
              </span>
            )}
          </div>
        </div>

        <ArrowRight
          className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
      
      {/* Notes section */}
      {jobsite.notes && (
        <p className="line-clamp-2 text-sm text-slate-500 pl-[52px]">
          {jobsite.notes}
        </p>
      )}
    </button>
  )
}

function getJobsiteIcon(jobsite: Jobsite) {
  const haystack = `${jobsite.name} ${jobsite.description || ''}`.toLowerCase()

  if (haystack.includes('data center') || haystack.includes('datacenter')) {
    return Building2
  }
  if (
    haystack.includes('plant') ||
    haystack.includes('factory') ||
    haystack.includes('manufactur')
  ) {
    return Factory
  }
  return HardHat
}
