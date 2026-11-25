import type { NextRequest } from 'next/server'
import { isChurchDashboardSourceConfigured, loadSecondDepartmentDashboardSnapshot } from '@/lib/churchDashboardGoogle'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!isChurchDashboardSourceConfigured()) {
      return Response.json({ ok: true, configured: false }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const snapshot = await loadSecondDepartmentDashboardSnapshot()
    if (!snapshot) throw new Error('dashboard_source_unavailable')
    const { error } = await supabaseAdmin.from('church_dashboard_snapshots').upsert(snapshot, {
      onConflict: 'church_place_id,department',
    })
    if (error) {
      console.error('church_dashboard_snapshot_write_failed', error.code)
      return Response.json({ ok: false, error: '저장하지 못했습니다.' }, { status: 503 })
    }
    return Response.json({ ok: true, configured: true, generatedAt: snapshot.generated_at }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('church_dashboard_snapshot_refresh_failed', error instanceof Error ? error.name : 'unknown')
    return Response.json({ ok: false, error: '2부 운영 자료를 새로고침하지 못했습니다.' }, { status: 503 })
  }
}
