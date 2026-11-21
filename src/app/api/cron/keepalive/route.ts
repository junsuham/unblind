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

  const now = new Date().toISOString()
  const [arrivalCleanup, missionCleanup] = await Promise.all([
    supabaseAdmin.from('recreation_arrival_rooms').delete().lt('expires_at', now),
    supabaseAdmin.from('recreation_mission_rooms').delete().lt('expires_at', now),
  ])
  if (arrivalCleanup.error) console.error('Expired arrival room cleanup failed:', arrivalCleanup.error.message)
  if (missionCleanup.error) console.error('Expired mission room cleanup failed:', missionCleanup.error.message)

  return Response.json({ ok: true, checkedAt: new Date().toISOString() })
}
