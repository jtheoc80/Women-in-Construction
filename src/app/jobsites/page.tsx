'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Jobsite } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { useGatedAction } from '@/contexts/AuthContext'
import {
  ArrowRight,
  Building2,
  Factory,
  HardHat,
  LoaderCircle,
  Search,
} from 'lucide-react'

export default function JobsitesIndexPage() {
  const router = useRouter()
  const [jobsites, setJobsites] = useState<Jobsite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { gateAction } = useGatedAction()

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

  // Group jobsites by state
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
          j.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobsites

  const handlePostListing = () => {
    gateAction(() => router.push('/design'))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onPostListing={handlePostListing} />

      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Explore Jobsites
          </h1>
          <p className="mt-3 text-base text-white/70">
            Find housing near major construction and data center projects
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-4 py-6">
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
}

// Jobsite Card Component
function JobsiteCard({
  jobsite,
  onClick,
}: {
  jobsite: Jobsite
  onClick: () => void
}) {
  const Icon = getJobsiteIcon(jobsite)
  return (
    <button
      onClick={onClick}
      aria-label={`View jobsite: ${jobsite.name}`}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
    >
      <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold text-slate-900">
          {jobsite.name}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {jobsite.city}, {jobsite.state}
        </p>
        {jobsite.description && (
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {jobsite.description}
          </p>
        )}
      </div>

      <ArrowRight
        className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5"
        aria-hidden="true"
      />
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
