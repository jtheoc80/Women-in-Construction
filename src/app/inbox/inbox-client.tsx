'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

type ListingSummary = {
  id: string
  city: string
  area: string | null
} | null

export type InboxPageData = {
  userId: string
  pendingRequests: Array<{
    id: string
    listing_id: string
    from_user_id: string
    to_user_id: string
    status: 'pending' | 'accepted' | 'declined' | string
    message: string | null
    created_at: string
    listings?: ListingSummary
  }>
  threads: Array<{
    id: string
    created_at: string
    last_message_at: string | null
    last_message_preview: string | null
    thread_participants: Array<{
      user_id: string
      last_read_at: string | null
    }>
  }>
  profileById: Record<string, string | null>
}

function formatShortDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isUnread(lastMessageAt: string | null, lastReadAt: string | null) {
  if (!lastMessageAt) return false
  if (!lastReadAt) return true
  return new Date(lastReadAt).getTime() < new Date(lastMessageAt).getTime()
}

export default function InboxClient({ userId, pendingRequests, threads, profileById }: InboxPageData) {
  const router = useRouter()
  const [requests, setRequests] = useState(pendingRequests)
  const [isPending, startTransition] = useTransition()
  const [busyRequestIds, setBusyRequestIds] = useState<Record<string, boolean>>({})

  const threadsWithNames = useMemo(() => {
    return threads.map((t) => {
      const other = t.thread_participants.find((p) => p.user_id !== userId)
      const otherName = other ? profileById[other.user_id] : null
      const self = t.thread_participants.find((p) => p.user_id === userId) || null
      return { ...t, otherName, selfLastReadAt: self?.last_read_at ?? null }
    })
  }, [threads, profileById, userId])

  async function acceptRequest(requestId: string) {
    setBusyRequestIds((s) => ({ ...s, [requestId]: true }))
    try {
      const res = await fetch(`/api/listing-requests/${requestId}/accept`, { method: 'POST' })
      const data = (await res.json()) as { thread_id?: string; error?: string }
      if (!res.ok || !data.thread_id) {
        throw new Error(data.error || 'Failed to accept request')
      }
      startTransition(() => {
        router.push(`/inbox/${data.thread_id}`)
        router.refresh()
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to accept request'
      alert(msg)
    } finally {
      setBusyRequestIds((s) => ({ ...s, [requestId]: false }))
    }
  }

  async function declineRequest(requestId: string) {
    setBusyRequestIds((s) => ({ ...s, [requestId]: true }))
    try {
      const res = await fetch(`/api/listing-requests/${requestId}/decline`, { method: 'POST' })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to decline request')
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      startTransition(() => router.refresh())
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to decline request'
      alert(msg)
    } finally {
      setBusyRequestIds((s) => ({ ...s, [requestId]: false }))
    }
  }

  return (
    <Tabs defaultValue="requests">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="requests">Requests</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
      </TabsList>

      <TabsContent value="requests" className="mt-4">
        {requests.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No pending requests.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const fromName = profileById[r.from_user_id] || 'Someone'
              const listingLabel = r.listings
                ? `${r.listings.area ? `${r.listings.area} • ` : ''}${r.listings.city}`
                : 'A listing'
              const busy = !!busyRequestIds[r.id] || isPending
              return (
                <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {fromName} requested an intro
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{listingLabel}</div>
                    </div>
                    <div className="text-xs text-slate-500">{formatShortDate(r.created_at)}</div>
                  </div>
                  {r.message ? (
                    <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                      {r.message}
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button disabled={busy} onClick={() => acceptRequest(r.id)}>
                      Accept
                    </Button>
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() => declineRequest(r.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="messages" className="mt-4">
        {threadsWithNames.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No messages yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {threadsWithNames.map((t) => {
              const title = t.otherName || 'Conversation'
              const unread = isUnread(t.last_message_at, t.selfLastReadAt)
              return (
                <Link
                  key={t.id}
                  href={`/inbox/${t.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {unread ? <span className="h-2 w-2 rounded-full bg-teal-600" /> : null}
                      <div className="text-sm font-medium text-slate-900">{title}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {t.last_message_at ? formatShortDate(t.last_message_at) : ''}
                    </div>
                  </div>
                  <div className="mt-1 line-clamp-1 text-sm text-slate-600">
                    {t.last_message_preview || 'No messages yet.'}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

