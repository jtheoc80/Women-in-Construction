import { notFound } from 'next/navigation'
import DesignClient from './design-client'

/**
 * Design page - development only.
 * 
 * This page is used for design preview and testing.
 * In production, it returns a 404.
 */
export default function DesignPage() {
  // Only allow access in development
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  function handlePostListingClick() {
    gateAction(() => {
      setShowPostModal(true)
    }, '/design')
  }

  function handleRequestIntro(e: React.FormEvent) {
    e.preventDefault()
    alert('Request sent! The listing owner will receive your message. (Demo mode)')
    setShowIntroModal(false)
    setIntroMessage('')
  }

  function handleReport(e: React.FormEvent) {
    e.preventDefault()
    alert('Report submitted. Thank you for helping keep our community safe. (Demo mode)')
    setShowReportModal(false)
    setReportReason('')
    setReportDetails('')
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Header - Sticky with backdrop blur */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-lg sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/design" className="flex items-center gap-2">
            <SiteLogo />
            <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              SiteSisters
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={handlePostListingClick}
              className="h-11 bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-500 sm:px-5 sm:text-base"
            >
              <span className="hidden sm:inline">+ Post Listing</span>
              <span className="sm:hidden">+ Post</span>
            </Button>
            
            <ProfilePill />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 pb-8 pt-10 text-center sm:pb-12 sm:pt-12">
        <h1 className="mx-auto max-w-lg text-2xl font-bold leading-tight text-white sm:max-w-2xl sm:text-4xl">
          A housing network for women who build.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/80 sm:mt-4 sm:max-w-xl sm:text-lg">
          Find roommates near construction and data center jobsites.
        </p>

        <p className="mt-4 text-xs text-white/50 sm:text-sm">
          Private by default • Request-to-connect • Report + moderation
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          <a 
            href="/jobsites" 
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white hover:bg-teal-500 sm:w-auto"
          >
            <Target className="h-4 w-4" />
            Plan my move
          </a>
          <a 
            href="#listings" 
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
          >
            <MapPin className="h-4 w-4" />
            Browse listings
          </a>
        </div>
      </section>

      {/* Filter Bar - Desktop inline, Mobile as button */}
      <section className="border-b border-slate-200 bg-white px-4 py-4 sm:py-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between sm:hidden">
            <h2 className="text-lg font-semibold text-slate-900">Find a place</h2>
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              className="h-11 gap-2 border-slate-300"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Desktop filters */}
          <div className="hidden gap-4 sm:flex sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">City / Region</label>
              <input
                type="text"
                placeholder="e.g. Phoenix, Austin, Columbus..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Max Rent</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={rentMaxFilter}
                onChange={(e) => setRentMaxFilter(e.target.value ? parseInt(e.target.value) : '')}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="w-44">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Room Type</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">All Types</option>
                <option value="private_room">Private Room</option>
                <option value="shared_room">Shared Room</option>
                <option value="entire_place">Entire Place</option>
              </select>
            </div>
            <Button
              onClick={handleSearch}
              className="h-11 bg-teal-600 px-6 font-semibold text-white hover:bg-teal-500"
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section id="listings" className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 sm:mb-6 sm:text-xl">
          {loading ? 'Loading listings...' : `${listings.length} Listings Available`}
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>No listings match your filters. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => setSelectedListing(listing)}
                className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Photo */}
                <div className="relative h-40 bg-slate-100 sm:h-44">
                  {getListingCoverPhotoUrl(listing) ? (
                    <img
                      src={getListingCoverPhotoUrl(listing)!}
                      alt={listing.area || listing.city}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600">
                      <span className="text-sm font-medium text-white/80">Photo coming soon</span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {formatRoomType(listing.room_type)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900">{listing.city}</h3>
                  {listing.area && (
                    <p className="mt-0.5 text-sm text-slate-500">{listing.area}</p>
                  )}
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    ${listing.rent_min || '?'} - ${listing.rent_max || '?'}<span className="text-sm font-normal">/mo</span>
                  </p>
                  {listing.commute_area && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      Near {listing.commute_area}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Move-in: {formatDate(listing.move_in)}
                  </p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">
                      Posted by {getDisplayName(listing)}
                      {getCompany(listing) && <span className="text-slate-500"> • {getCompany(listing)}</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-4 py-8 text-center">
        <p className="text-sm text-slate-400">© 2026 SiteSisters. All rights reserved.</p>
        <p className="mt-2 text-xs italic text-slate-500">Built for women who build.</p>
      </footer>

      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <div className="space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">City / Region</label>
            <input
              type="text"
              placeholder="e.g. Phoenix, Austin, Columbus..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Max Rent</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={rentMaxFilter}
              onChange={(e) => setRentMaxFilter(e.target.value ? parseInt(e.target.value) : '')}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">Room Type</label>
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="private_room">Private Room</option>
              <option value="shared_room">Shared Room</option>
              <option value="entire_place">Entire Place</option>
            </select>
          </div>
          <Button
            onClick={handleSearch}
            className="h-12 w-full bg-teal-600 text-base font-semibold text-white hover:bg-teal-500"
          >
            Apply Filters
          </Button>
        </div>
      </BottomSheet>

      {/* Listing Detail - Bottom sheet on mobile, slide-over on desktop */}
      <SlideOver
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title={selectedListing?.title || selectedListing?.city || 'Listing'}
      >
        {selectedListing && (
          <div className="p-4 sm:p-6">
            <PhotoCarousel photos={getListingPhotoUrls(selectedListing)} />

            <h2 className="mt-4 text-xl font-bold text-white sm:text-2xl">
              {selectedListing.title || selectedListing.city}
            </h2>
            {selectedListing.area && (
              <p className="mt-1 text-white/60">{selectedListing.area}</p>
            )}

            {/* Meta grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/50">Room Type</p>
                <p className="mt-1 font-semibold text-white">{formatRoomType(selectedListing.room_type)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/50">Rent Range</p>
                <p className="mt-1 font-semibold text-white">
                  ${selectedListing.rent_min || '?'} - ${selectedListing.rent_max || '?'}/mo
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/50">Move-in Date</p>
                <p className="mt-1 font-semibold text-white">{formatDate(selectedListing.move_in)}</p>
              </div>
              {selectedListing.commute_area && (
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-white/50">Commute Area</p>
                  <p className="mt-1 font-semibold text-white">{selectedListing.commute_area}</p>
                </div>
              )}
            </div>

            {/* Private address (owner only) */}
            {user && selectedListing.user_id === user.id && selectedListing.full_address && (
              <div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-400">
                  <Lock className="h-4 w-4" />
                  Your Private Address
                </div>
                <p className="mt-2 text-white">{selectedListing.full_address}</p>
                <p className="mt-1 text-xs text-white/50">Only you can see this</p>
              </div>
            )}

            {/* Tags */}
            {selectedListing.tags && selectedListing.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedListing.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-white">About this listing</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {selectedListing.details || 'No additional details provided.'}
              </p>
            </div>

            {/* Poster info */}
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-white/5 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{getDisplayName(selectedListing)}</p>
                {getCompany(selectedListing) && (
                  <p className="text-sm text-white/60">{getCompany(selectedListing)}</p>
                )}
                {selectedListing.poster_profiles?.role && (
                  <p className="text-sm text-white/40">{selectedListing.poster_profiles.role}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowIntroModal(true)}
                className="h-12 flex-1 bg-teal-600 font-semibold text-white hover:bg-teal-500"
              >
                Request Intro
              </Button>
              <Button
                onClick={() => setShowReportModal(true)}
                variant="outline"
                className="h-12 border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                Report
              </Button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Post Listing Modal */}
      <PostListingModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={loadListings}
      />

      {/* Request Intro Modal */}
      <BottomSheet
        open={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        title="Request an Introduction"
      >
        {selectedListing && (
          <form onSubmit={handleRequestIntro} className="p-4 sm:p-6">
            <p className="text-sm text-white/70">
              Send an intro request to {getDisplayName(selectedListing)}. 
              If they accept, you&apos;ll both receive each other&apos;s contact info.
            </p>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-white/90">Your Message</label>
              <textarea
                placeholder="Introduce yourself! Mention your job, schedule, and what you're looking for."
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                rows={4}
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              className="mt-4 h-12 w-full bg-teal-600 font-semibold text-white hover:bg-teal-500"
            >
              Send Intro Request
            </Button>
          </form>
        )}
      </BottomSheet>

      {/* Report Modal */}
      <BottomSheet
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Listing"
      >
        <form onSubmit={handleReport} className="p-4 sm:p-6">
          <p className="text-sm text-white/70">
            Help us keep SiteSisters safe. Reports are anonymous.
          </p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">Reason *</label>
              <select
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or fake listing</option>
                <option value="scam">Suspected scam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90">Additional Details</label>
              <textarea
                placeholder="Any additional context that might help us review this report."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="mt-4 h-12 w-full bg-red-600 font-semibold text-white hover:bg-red-500"
          >
            Submit Report
          </Button>
        </form>
      </BottomSheet>
    </div>
  )
}
