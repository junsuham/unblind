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
    const { data, error } = await supabaseAdmin.rpc('replace_top100_tracks', {
      p_tracks: rows,
    })
    if (error) throw error

    return Response.json({
      ok: true,
      count: data ?? tracks.length,
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
