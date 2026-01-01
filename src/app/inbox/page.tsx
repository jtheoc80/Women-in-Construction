import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import InboxClient, { type InboxPageData } from './inbox-client'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?next=/inbox')
  }

  const [pendingRequestsRes, threadsRes] = await Promise.all([
    supabase
      .from('listing_requests')
      .select('id, listing_id, from_user_id, to_user_id, status, message, created_at, listings(id, city, area)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('threads')
      .select('id, created_at, last_message_at, last_message_preview, thread_participants(user_id, last_read_at)')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const pendingRequests = (pendingRequestsRes.data || []) as InboxPageData['pendingRequests']
  const threads = (threadsRes.data || []) as InboxPageData['threads']

  const requestUserIds = pendingRequests.map((r) => r.from_user_id)
  const threadUserIds = threads.flatMap((t) => t.thread_participants.map((p) => p.user_id))
  const uniqueUserIds = Array.from(new Set([...requestUserIds, ...threadUserIds].filter(Boolean)))

  const { data: profileDisplayRows } = uniqueUserIds.length
    ? await supabase.from('profile_display').select('id, display_name').in('id', uniqueUserIds)
    : { data: [] as Array<{ id: string; display_name: string | null }> }

  const profileById: Record<string, string | null> = {}
  for (const row of profileDisplayRows || []) {
    profileById[row.id] = row.display_name
  }

  const pageData: InboxPageData = {
    userId: user.id,
    pendingRequests,
    threads,
    profileById,
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>
      <div className="mt-6">
        <InboxClient {...pageData} />
      </div>
    </main>
  )
}

