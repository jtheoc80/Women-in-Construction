import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ThreadClient, { type ThreadPageData } from './thread-client'

export const dynamic = 'force-dynamic'

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/signup?next=/inbox/${encodeURIComponent(threadId)}`)
  }

  const { data: thread } = await supabase
    .from('threads')
    .select('id, created_at, last_message_at, last_message_preview, thread_participants(user_id, last_read_at)')
    .eq('id', threadId)
    .single()

  if (!thread) {
    redirect('/inbox')
  }

  const participants = (thread.thread_participants || []) as Array<{
    user_id: string
    last_read_at: string | null
  }>

  const isParticipant = participants.some((p) => p.user_id === user.id)
  if (!isParticipant) {
    redirect('/inbox')
  }

  const { data: messagesDesc } = await supabase
    .from('messages')
    .select('id, thread_id, sender_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(30)

  const messages = (messagesDesc || []).slice().reverse()

  const otherUserId = participants.find((p) => p.user_id !== user.id)?.user_id || null

  const { data: otherProfile } = otherUserId
    ? await supabase.from('profile_display').select('id, display_name').eq('id', otherUserId).single()
    : { data: null as null | { id: string; display_name: string | null } }

  const pageData: ThreadPageData = {
    threadId,
    userId: user.id,
    otherUser: otherProfile ? { id: otherProfile.id, display_name: otherProfile.display_name } : null,
    initialMessages: messages,
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/inbox" className="hover:underline">
              Inbox
            </Link>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {pageData.otherUser?.display_name || 'Conversation'}
          </h1>
        </div>
      </div>

      <ThreadClient {...pageData} />
    </main>
  )
}

