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
  const { data, error } = await supabase.rpc('accept_listing_request', { p_request_id: requestId })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ thread_id: data })
}

