import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { getRequestIdentity } from '@/lib/rateLimitKey'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

type ArrivalRoom = {
  id: string
  room_code: string
  organizer_user_id: string
  title: string
  appointment_at: string
  expires_at: string
}

async function loadRoom(code: string) {
  if (!/^[a-f0-9]{32}$/.test(code)) return null
  const { data, error } = await supabaseAdmin
    .from('recreation_arrival_rooms')
    .select('id, room_code, organizer_user_id, title, appointment_at, expires_at')
    .eq('room_code', code)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle<ArrivalRoom>()
  if (error) throw error
  return data
}

function readError(error: unknown) {
  console.error('Arrival room failed:', error instanceof Error ? error.message : error)
  return Response.json({ error: '모임 정보를 처리하지 못했습니다.' }, { status: 500 })
}

export async function GET(request: Request, ctx: RouteContext<'/api/recreation/arrival/[code]'>) {
  const { code } = await ctx.params
  try {
    const room = await loadRoom(code)
    if (!room) return Response.json({ error: '만료되었거나 없는 모임입니다.' }, { status: 404 })

    const { data: participants, error } = await supabaseAdmin
      .from('recreation_arrival_participants')
      .select('id, display_name, joined_at, arrived_at')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true })
      .limit(100)
    if (error) throw error

    // Authentication is checked only on the initial load; subsequent clock
    // polls omit this flag. The mutation route verifies ownership anew.
    const wantsHost = new URL(request.url).searchParams.get('host') === '1'
    const host = wantsHost ? await getCommunityRequestUser(request) : null

    return Response.json({
      room: {
        title: room.title,
        appointmentAt: room.appointment_at,
        expiresAt: room.expires_at,
      },
      serverNow: new Date().toISOString(),
      participants: participants ?? [],
      ...(wantsHost ? { isHost: host?.id === room.organizer_user_id } : {}),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return readError(error)
  }
}

export async function POST(request: Request, ctx: RouteContext<'/api/recreation/arrival/[code]'>) {
  const { code } = await ctx.params
  try {
    const room = await loadRoom(code)
    if (!room) return Response.json({ error: '만료되었거나 없는 모임입니다.' }, { status: 404 })

    const blocked = await guardMutation(request, {
      bucket: 'recreation-arrival-join',
      identity: `${room.id}:${getRequestIdentity(request)}`,
      // Guests at the same church often share one Wi-Fi/IP and iPhone user agent.
      // The room itself is capped at 100 participants, so this must not block
      // a normal full-room arrival.
      limit: 120,
      windowSeconds: 600,
    })
    if (blocked) return blocked

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
    if (name.length < 1 || name.length > 20 || !/^[\p{L}\p{N} ]+$/u.test(name)) {
      return Response.json({ error: '이름은 한글·영문·숫자로 1~20자 입력해주세요.' }, { status: 400 })
    }

    const { count, error: countError } = await supabaseAdmin
      .from('recreation_arrival_participants')
      .select('id', { head: true, count: 'exact' })
      .eq('room_id', room.id)
    if (countError) throw countError
    if ((count ?? 0) >= 100) return Response.json({ error: '모임 인원이 모두 찼습니다.' }, { status: 409 })

    const { data, error } = await supabaseAdmin
      .from('recreation_arrival_participants')
      .insert({ room_id: room.id, display_name: name })
      .select('id')
      .single<{ id: string }>()
    if (error) throw error
    return Response.json({ participantId: data.id }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return readError(error)
  }
}

export async function PATCH(request: Request, ctx: RouteContext<'/api/recreation/arrival/[code]'>) {
  const { code } = await ctx.params
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '진행자 로그인이 필요합니다.' }, { status: 401 })

  try {
    const room = await loadRoom(code)
    if (!room) return Response.json({ error: '만료되었거나 없는 모임입니다.' }, { status: 404 })
    if (room.organizer_user_id !== user.id) {
      return Response.json({ error: '도착 체크는 진행자만 할 수 있습니다.' }, { status: 403 })
    }

    const blocked = await guardMutation(request, {
      bucket: 'recreation-arrival-check',
      identity: user.id,
      limit: 40,
      windowSeconds: 60,
    })
    if (blocked) return blocked

    const body = await request.json().catch(() => null)
    const participantId = typeof body?.participantId === 'string' ? body.participantId : ''
    if (!/^[a-f0-9-]{36}$/i.test(participantId) || typeof body?.arrived !== 'boolean') {
      return Response.json({ error: '도착 체크 대상을 확인해주세요.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('recreation_arrival_participants')
      .update({ arrived_at: body.arrived ? new Date().toISOString() : null })
      .eq('id', participantId)
      .eq('room_id', room.id)
      .select('id, arrived_at')
      .maybeSingle<{ id: string; arrived_at: string | null }>()
    if (error) throw error
    if (!data) return Response.json({ error: '참가자를 찾지 못했습니다.' }, { status: 404 })
    return Response.json({ participant: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return readError(error)
  }
}
