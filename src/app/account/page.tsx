import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { AccountProfileForm } from '@/components/AccountProfileForm'
import { Suspense } from 'react'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup?next=/account')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,display_name,first_name,home_city,created_at,updated_at')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">My profile</h1>
        <p className="mt-1 text-slate-600">
          Update your name and home base city.
        </p>

        <Suspense fallback={null}>
          <AccountProfileForm initialProfile={profile ?? null} />
        </Suspense>
      </div>
    </main>
  )
}

