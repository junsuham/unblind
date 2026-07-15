import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function isAdmin(request: NextRequest) {
  return Boolean(process.env.ADMIN_SESSION_TOKEN) && request.cookies.get('admin_session')?.value === process.env.ADMIN_SESSION_TOKEN
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return Response.json({ error: '관리자 권한이 없습니다.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const action = body?.action

  if (action === 'manitto') {
    const { error } = await supabaseAdmin.from('manitto_settings').upsert({
      id: 1,
      is_active: Boolean(body.isActive),
      starts_on: body.startsOn || null,
      ends_on: body.endsOn || null,
      reveal_enabled: Boolean(body.revealEnabled),
      updated_at: new Date().toISOString(),
    })
    return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true })
  }

  if (action === 'seed-tracks') {
    const tracks = Array.isArray(body.tracks) ? body.tracks.slice(0, 100) : []
    if (!tracks.length) return Response.json({ error: '저장할 곡이 없습니다.' }, { status: 400 })
    await supabaseAdmin.from('top100_tracks').delete().gte('rank', 1)
    const rows = tracks.map((track: { id: string; title: string; artist: string }, index: number) => ({ rank: index + 1, youtube_id: track.id, title: track.title, artist: track.artist, is_active: true }))
    const { error } = await supabaseAdmin.from('top100_tracks').insert(rows)
    return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true })
  }

  if (action === 'upsert-track') {
    const row = { rank: Number(body.rank), youtube_id: String(body.youtubeId ?? '').trim(), title: String(body.title ?? '').trim(), artist: String(body.artist ?? '').trim(), is_active: body.isActive !== false, updated_at: new Date().toISOString() }
    if (!row.youtube_id || !row.title || !row.artist || row.rank < 1 || row.rank > 100) return Response.json({ error: '곡 정보를 확인해주세요.' }, { status: 400 })
    const query = body.id
      ? supabaseAdmin.from('top100_tracks').update(row).eq('id', body.id)
      : supabaseAdmin.from('top100_tracks').insert(row)
    const { error } = await query
    return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true })
  }

  if (action === 'delete-track') {
    const { error } = await supabaseAdmin.from('top100_tracks').delete().eq('id', body.id)
    return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true })
  }

  if (action === 'add-banned-word') {
    const word = String(body.word ?? '').trim()
    if (word.length < 2 || word.length > 40) return Response.json({ error: '금칙어는 2~40자로 입력해주세요.' }, { status: 400 })
    const { error } = await supabaseAdmin.from('banned_words').insert({ word })
    return error ? Response.json({ error: error.code === '23505' ? '이미 등록된 금칙어입니다.' : error.message }, { status: 400 }) : Response.json({ ok: true })
  }

  if (action === 'delete-banned-word') {
    const { error } = await supabaseAdmin.from('banned_words').delete().eq('id', body.id)
    return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true })
  }

  return Response.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 })
}
