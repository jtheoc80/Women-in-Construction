import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?next=/inbox')
  }

  // Placeholder: messaging UI comes later.
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>
      <p className="mt-2 text-slate-600">
        Coming soon.
      </p>
    </main>
  )
}

