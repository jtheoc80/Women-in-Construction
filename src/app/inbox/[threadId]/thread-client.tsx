'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

export type ThreadMessage = {
  id: string
  thread_id: string
  sender_id: string
  body: string
  created_at: string
}

export type ThreadPageData = {
  threadId: string
  userId: string
  otherUser: { id: string; display_name: string | null } | null
  initialMessages: ThreadMessage[]
}

function formatTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function ThreadClient({ threadId, userId, otherUser, initialMessages }: ThreadPageData) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, startSend] = useTransition()
  const [isLoadingMore, startLoadMore] = useTransition()
  const [hasMore, setHasMore] = useState(initialMessages.length >= 30)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const oldestCreatedAt = messages[0]?.created_at || null

  useEffect(() => {
    // mark read
    const nowIso = new Date().toISOString()
    supabase
      .from('thread_participants')
      .update({ last_read_at: nowIso })
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .then(() => {})
  }, [supabase, threadId, userId])

  useEffect(() => {
    // realtime inserts for this thread
    const channel = supabase
      .channel(`messages:thread:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresInsertPayload<ThreadMessage>) => {
          const row = payload.new as ThreadMessage
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
  }, [])

  async function loadOlder() {
    if (!oldestCreatedAt) return
    startLoadMore(async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, thread_id, sender_id, body, created_at')
        .eq('thread_id', threadId)
        .lt('created_at', oldestCreatedAt)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) {
        alert(error.message)
        return
      }

      const older = (data || []).slice().reverse()
      setMessages((prev) => [...older, ...prev])
      setHasMore((data || []).length >= 30)
    })
  }

  async function sendMessage() {
    const body = input.trim()
    if (!body) return

    startSend(async () => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ thread_id: threadId, sender_id: userId, body })
        .select('id, thread_id, sender_id, body, created_at')
        .single()

      if (error) {
        alert(error.message)
        return
      }

      setInput('')
      if (data) {
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
      }
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div className="text-sm font-medium text-slate-900">
          {otherUser?.display_name || 'Conversation'}
        </div>
        <div className="mt-1 text-xs text-slate-500">Messages are only visible to participants.</div>
      </div>

      <div className="p-4">
        {hasMore ? (
          <div className="mb-4 flex justify-center">
            <Button variant="outline" disabled={isLoadingMore} onClick={loadOlder}>
              Load older messages
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === userId
            return (
              <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={[
                    'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                    mine ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-900',
                  ].join(' ')}
                >
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className={mine ? 'mt-1 text-xs text-teal-50/80' : 'mt-1 text-xs text-slate-500'}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void sendMessage()
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message…"
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || input.trim().length === 0}>
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

