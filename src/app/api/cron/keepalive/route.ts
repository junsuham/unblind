import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('allowed_users')
    .select('email', { head: true, count: 'estimated' })

  if (error) {
    console.error('Supabase keepalive failed:', error.message)
    return Response.json({ ok: false, error: 'Database unavailable' }, { status: 503 })
  }

  return Response.json({ ok: true, checkedAt: new Date().toISOString() })
}
