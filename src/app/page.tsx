const sampleListings = [
  {
    id: 1,
    city: 'Austin',
    area: 'East Side',
    rent: '$850',
    moveIn: 'Feb 1',
    shift: 'Day shift',
  },
  {
    id: 2,
    city: 'Phoenix',
    area: 'Chandler',
    rent: '$725',
    moveIn: 'Jan 15',
    shift: 'Swing shift',
  },
  {
    id: 3,
    city: 'Denver',
    area: 'Aurora',
    rent: '$900',
    moveIn: 'Feb 15',
    shift: 'Day shift',
  },
]

function ListingCard({ listing }: { listing: typeof sampleListings[0] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-slate-900">{listing.city}</p>
          <p className="text-sm text-slate-500">{listing.area}</p>
        </div>
        <span className="text-lg font-bold text-brand-navy">{listing.rent}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {listing.moveIn}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {listing.shift}
        </span>
      </div>
    </div>
  )
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </span>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Subtle purple glow accent */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-purple/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-purple/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="font-semibold text-xl text-slate-900">SiteSisters</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              Browse
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors">
              Post a listing
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-tight tracking-tight">
              Roommates who get the jobsite schedule.
            </h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              Women-first roommate matching for construction &amp; data center projects. 
              No public contact info. Intros by request.
            </p>
            
            {/* Trust Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              <TrustChip>No public contact</TrustChip>
              <TrustChip>Request-to-connect</TrustChip>
              <TrustChip>Report + moderation</TrustChip>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button className="px-6 py-3 text-base font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 rounded-lg transition-colors shadow-sm">
                Browse listings
              </button>
              <button className="px-6 py-3 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors">
                Post a listing
              </button>
            </div>

            {/* Privacy Note */}
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Contact details are shared only if accepted.
            </p>
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:pl-8">
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recent Listings</h3>
                <span className="text-xs text-slate-500">Preview</span>
              </div>
              <div className="space-y-3">
                {sampleListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Section */}
      <section id="browse" className="relative z-10 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Browse Listings</h2>
            <p className="text-slate-600">Find roommates near your next project.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <select className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple">
              <option>All Cities</option>
              <option>Austin</option>
              <option>Phoenix</option>
              <option>Denver</option>
              <option>Dallas</option>
              <option>Las Vegas</option>
            </select>
            <select className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple">
              <option>Any Rent</option>
              <option>Under $600</option>
              <option>$600 - $800</option>
              <option>$800 - $1000</option>
              <option>$1000+</option>
            </select>
            <select className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple">
              <option>Any Shift</option>
              <option>Day shift</option>
              <option>Swing shift</option>
              <option>Night shift</option>
            </select>
            <select className="px-4 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple">
              <option>Move-in Date</option>
              <option>This month</option>
              <option>Next month</option>
              <option>Flexible</option>
            </select>
          </div>

          {/* Listings Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 1, city: 'Austin', area: 'East Side', rent: '$850', moveIn: 'Feb 1', shift: 'Day shift', roomType: 'Private room' },
              { id: 2, city: 'Phoenix', area: 'Chandler', rent: '$725', moveIn: 'Jan 15', shift: 'Swing shift', roomType: 'Shared room' },
              { id: 3, city: 'Denver', area: 'Aurora', rent: '$900', moveIn: 'Feb 15', shift: 'Day shift', roomType: 'Private room' },
              { id: 4, city: 'Dallas', area: 'Irving', rent: '$775', moveIn: 'Jan 20', shift: 'Night shift', roomType: 'Private room' },
              { id: 5, city: 'Las Vegas', area: 'Henderson', rent: '$650', moveIn: 'Feb 1', shift: 'Day shift', roomType: 'Shared room' },
              { id: 6, city: 'Austin', area: 'Round Rock', rent: '$825', moveIn: 'Mar 1', shift: 'Swing shift', roomType: 'Private room' },
            ].map((listing) => (
              <div key={listing.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-brand-navy transition-colors">{listing.city}</p>
                    <p className="text-sm text-slate-500">{listing.area}</p>
                  </div>
                  <span className="text-xl font-bold text-brand-navy">{listing.rent}</span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Move-in: {listing.moveIn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>{listing.roomType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {listing.shift}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <button className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors">
              Load more listings
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SS</span>
              </div>
              <span className="font-medium text-white">SiteSisters</span>
            </div>
            <p className="text-sm">© 2026 SiteSisters. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
