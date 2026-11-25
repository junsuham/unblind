import { createHash, randomBytes } from 'node:crypto'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { isManittoMakerCode, isManittoMakerName, normalizeManittoMakerName } from '@/lib/manittoMakerShared'
import { guardMutation } from '@/lib/mutationGuard'
import { getRequestIdentity } from '@/lib/rateLimitKey'
import { isSafeMutationRequest } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }
const tokenHeader = 'x-manitto-maker-guest-token'
const tokenPattern = /^[A-Za-z0-9_-]{43}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RoomRow = {
  id: string
  code: string
  host_user_id: string
  title: string
  note: string
  capacity: number
  status: 'open' | 'drawn'
  drawn_at: string | null
  expires_at: string
}

async function loadRoom(code: string) {
  if (!isManittoMakerCode(code)) return null
  const { data, error } = await supabaseAdmin.from('manitto_maker_rooms')
    .select('id, code, host_user_id, title, note, capacity, status, drawn_at, expires_at')
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle<RoomRow>()
  return error ? null : data
}

function digestToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function GET(request: Request, context: RouteContext<'/api/manitto/maker/[code]'>) {
  const { code } = await context.params
  const room = await loadRoom(code)
  if (!room) return Response.json({ error: '만료되었거나 존재하지 않는 마니또 모임입니다.' }, { status: 404, headers: noStore })

  const { count, error: countError } = await supabaseAdmin.from('manitto_maker_participants')
    .select('id', { head: true, count: 'exact' }).eq('room_id', room.id)
  if (countError) return Response.json({ error: '모임 정보를 불러오지 못했습니다.' }, { status: 503, headers: noStore })

  const result: {
    room: { code: string; title: string; note: string; capacity: number; status: 'open' | 'drawn'; drawnAt: string | null; expiresAt: string }
    participantCount: number
    isHost: boolean
    participants?: { id: string; name: string; joinedAt: string }[]
    me?: { name: string; recipientName: string | null }
    tokenInvalid?: boolean
  } = {
    room: { code: room.code, title: room.title, note: room.note, capacity: room.capacity, status: room.status, drawnAt: room.drawn_at, expiresAt: room.expires_at },
    participantCount: count ?? 0,
    isHost: false,
  }

  const token = request.headers.get(tokenHeader)
  if (token) {
    if (!tokenPattern.test(token)) result.tokenInvalid = true
    else {
      const { data: participant } = await supabaseAdmin.from('manitto_maker_participants')
        .select('name, recipient_id')
        .eq('room_id', room.id)
        .eq('token_hash', digestToken(token))
        .maybeSingle<{ name: string; recipient_id: string | null }>()
      if (!participant) result.tokenInvalid = true
      else {
        let recipientName: string | null = null
        if (room.status === 'drawn' && participant.recipient_id) {
          const { data: recipient } = await supabaseAdmin.from('manitto_maker_participants')
            .select('name').eq('id', participant.recipient_id).eq('room_id', room.id)
            .maybeSingle<{ name: string }>()
          recipientName = recipient?.name ?? null
        }
        result.me = { name: participant.name, recipientName }
      }
    }
  }

  if (new URL(request.url).searchParams.get('host') === '1') {
    const user = await getCommunityRequestUser(request)
    if (user?.id === room.host_user_id) {
      result.isHost = true
      const { data: participants, error } = await supabaseAdmin.from('manitto_maker_participants')
        .select('id, name, joined_at').eq('room_id', room.id).order('joined_at', { ascending: true }).limit(50)
        .returns<{ id: string; name: string; joined_at: string }[]>()
      if (error) return Response.json({ error: '참가자 목록을 불러오지 못했습니다.' }, { status: 503, headers: noStore })
      result.participants = (participants ?? []).map((participant) => ({ id: participant.id, name: participant.name, joinedAt: participant.joined_at }))
    }
  }
  return Response.json(result, { headers: noStore })
}

export async function POST(request: Request, context: RouteContext<'/api/manitto/maker/[code]'>) {
  if (!isSafeMutationRequest(request)) return Response.json({ error: '요청 출처를 확인할 수 없습니다.' }, { status: 403, headers: noStore })
  const { code } = await context.params
  const room = await loadRoom(code)
  if (!room) return Response.json({ error: '만료되었거나 존재하지 않는 마니또 모임입니다.' }, { status: 404, headers: noStore })
  const body = await request.json().catch(() => null)

  if (body?.action === 'join') {
    const blocked = await guardMutation(request, {
      bucket: 'manitto-maker-join',
      identity: `${room.id}:${getRequestIdentity(request)}`,
      limit: 80,
      windowSeconds: 60 * 60,
    })
    if (blocked) return blocked
    const name = typeof body?.name === 'string' ? normalizeManittoMakerName(body.name) : ''
    if (!isManittoMakerName(name)) return Response.json({ error: '사용할 이름을 1~24자로 입력해주세요.' }, { status: 400, headers: noStore })
    const token = randomBytes(32).toString('base64url')
    const { error } = await supabaseAdmin.rpc('join_manitto_maker_room', {
      p_code: code,
      p_name: name,
      p_token_hash: digestToken(token),
    })
    if (error?.code === '23505') return Response.json({ error: '이미 사용 중인 이름입니다. 진행자에게 확인해주세요.' }, { status: 409, headers: noStore })
    if (error) return Response.json({ error: '입장하지 못했습니다. 인원 또는 추첨 상태를 확인해주세요.' }, { status: 409, headers: noStore })
    return Response.json({ token }, { status: 201, headers: noStore })
  }

  if (body?.action === 'draw' || body?.action === 'remove') {
    const user = await getCommunityRequestUser(request)
    if (!user || user.id !== room.host_user_id) return Response.json({ error: '진행자 권한이 필요합니다.' }, { status: 403, headers: noStore })
    const blocked = await guardMutation(request, { bucket: 'manitto-maker-manage', identity: user.id, limit: 20, windowSeconds: 60 })
    if (blocked) return blocked
    if (body.action === 'draw') {
      const { data, error } = await supabaseAdmin.rpc('draw_manitto_maker_room', { p_room_id: room.id, p_host_user_id: user.id })
      if (error) return Response.json({ error: '추첨하지 못했습니다. 참가자가 3명 이상인지, 이미 추첨했는지 확인해주세요.' }, { status: 409, headers: noStore })
      return Response.json({ ok: true, participantCount: data }, { headers: noStore })
    }

    const participantId = typeof body.participantId === 'string' ? body.participantId : ''
    if (!uuidPattern.test(participantId)) return Response.json({ error: '참가자를 선택해주세요.' }, { status: 400, headers: noStore })
    const { error } = await supabaseAdmin.rpc('remove_manitto_maker_participant', {
      p_room_id: room.id,
      p_host_user_id: user.id,
      p_participant_id: participantId,
    })
    if (error) return Response.json({ error: '참가자를 제외하지 못했습니다. 추첨 상태를 확인해주세요.' }, { status: 409, headers: noStore })
    return Response.json({ ok: true }, { headers: noStore })
  }

  return Response.json({ error: '지원하지 않는 요청입니다.' }, { status: 400, headers: noStore })
}
