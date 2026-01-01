'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Jobsite } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { useGatedAction } from '@/contexts/AuthContext'

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
    <div style={styles.page}>
      {/* Header */}
      <Navbar onPostListing={handlePostListing} />

      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Explore Jobsites</h1>
        <p style={styles.heroSubtitle}>
          Find housing near major construction and data center projects
        </p>
      </section>

      {/* Search */}
      <section style={styles.searchSection}>
        <input
          type="text"
          placeholder="Search by jobsite name, city, or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </section>

      {/* Main Content */}
      <main style={styles.main}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p>Loading jobsites...</p>
          </div>
        ) : searchQuery ? (
          // Search Results
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Search Results ({filteredJobsites.length})
            </h2>
            <div style={styles.jobsitesGrid}>
              {filteredJobsites.map((jobsite) => (
                <JobsiteCard
                  key={jobsite.id}
                  jobsite={jobsite}
                  onClick={() => router.push(`/jobsites/${jobsite.slug}`)}
                />
              ))}
              {filteredJobsites.length === 0 && (
                <p style={styles.emptyState}>
                  No jobsites found matching &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
          </section>
        ) : (
          // Grouped by State
          Object.entries(groupedJobsites)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([state, stateJobsites]) => (
              <section key={state} style={styles.section}>
                <h2 style={styles.sectionTitle}>{stateNames[state] || state}</h2>
                <div style={styles.jobsitesGrid}>
                  {stateJobsites.map((jobsite) => (
                    <JobsiteCard
                      key={jobsite.id}
                      jobsite={jobsite}
                      onClick={() => router.push(`/jobsites/${jobsite.slug}`)}
                    />
                  ))}
                </div>
              </section>
            ))
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 SiteSisters. All rights reserved.</p>
        <p style={styles.footerTagline}>Built for women who build.</p>
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
  return (
    <button onClick={onClick} style={cardStyles.container}>
      <div style={cardStyles.iconContainer}>
        <span style={cardStyles.icon}>🏗️</span>
      </div>
      <div style={cardStyles.content}>
        <h3 style={cardStyles.name}>{jobsite.name}</h3>
        <p style={cardStyles.location}>
          {jobsite.city}, {jobsite.state}
        </p>
        {jobsite.description && (
          <p style={cardStyles.description}>{jobsite.description}</p>
        )}
      </div>
      <div style={cardStyles.arrow}>→</div>
    </button>
  )
}

const cardStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'transform 0.2s, box-shadow 0.2s',
    width: '100%',
  } as React.CSSProperties,
  iconContainer: {
    width: '56px',
    height: '56px',
    background: '#fef3c7',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  icon: {
    fontSize: '1.75rem',
  } as React.CSSProperties,
  content: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  name: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '4px',
  } as React.CSSProperties,
  location: {
    fontSize: '0.9rem',
    color: '#64748b',
    marginBottom: '4px',
  } as React.CSSProperties,
  description: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  arrow: {
    fontSize: '1.25rem',
    color: '#94a3b8',
    flexShrink: 0,
  } as React.CSSProperties,
}

const styles = {
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
  } as React.CSSProperties,
  searchSection: {
    background: 'white',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  } as React.CSSProperties,
  searchInput: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    display: 'block',
    padding: '12px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
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
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1e293b',
    marginBottom: '16px',
  } as React.CSSProperties,
  jobsitesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b',
    gridColumn: '1 / -1',
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
