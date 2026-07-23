import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getWeeklyPraiseTop50 } from '@/lib/weeklyPraise'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function getFailureMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}

type PraiseTrackRow = {
  youtube_id: string
  title: string
  artist: string
}

async function replaceWeeklyTracks(rows: PraiseTrackRow[]) {
  const { error: rpcError } = await supabaseAdmin.rpc('replace_top100_tracks', {
    p_tracks: rows,
  })
  if (!rpcError) return
  if (!getFailureMessage(rpcError).includes('DELETE requires a WHERE clause')) {
    throw rpcError
  }

  const { data: previousRows, error: snapshotError } = await supabaseAdmin
    .from('top100_tracks')
    .select('id, rank, youtube_id, title, artist, is_active, updated_at')
    .gte('rank', 1)
    .lte('rank', 100)
    .order('rank', { ascending: true })
  if (snapshotError) throw snapshotError

  const { error: deleteError } = await supabaseAdmin
    .from('top100_tracks')
    .delete()
    .gte('rank', 1)
    .lte('rank', 100)
  if (deleteError) throw deleteError

  const now = new Date().toISOString()
  const { error: insertError } = await supabaseAdmin.from('top100_tracks').insert(
    rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      is_active: true,
      updated_at: now,
    })),
  )
  if (!insertError) return

  if (previousRows?.length) {
    const { error: restoreError } = await supabaseAdmin
      .from('top100_tracks')
      .insert(previousRows)
    if (restoreError) {
      console.error('Weekly praise rollback failed:', getFailureMessage(restoreError))
    }
  }
  throw insertError
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY?.trim()
  if (!apiKey) {
    return Response.json({ error: 'YouTube API 연결이 필요합니다.' }, { status: 503 })
  }

  try {
    const tracks = await getWeeklyPraiseTop50(apiKey)
    const rows = tracks.map((track) => ({
      youtube_id: track.id,
      title: track.title,
      artist: track.artist,
    }))
    await replaceWeeklyTracks(rows)

    return Response.json({
      ok: true,
      count: tracks.length,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Weekly praise refresh failed:', getFailureMessage(error))
    return Response.json(
      { error: '이번 주 TOP50 갱신에 실패해 기존 목록을 유지합니다.' },
      { status: 502 },
    )
  }
}
