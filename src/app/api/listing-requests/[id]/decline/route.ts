import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const requestId = params.id
  const { error } = await supabase
    .from('listing_requests')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

