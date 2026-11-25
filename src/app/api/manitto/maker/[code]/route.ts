import { createHash, randomBytes } from 'node:crypto'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import {
  MANITTO_MAKER_MIN_MEMBERS,
  MANITTO_MAKER_TOKEN_HEADER,
  isManittoMakerCode,
  isManittoMakerName,
  isManittoMakerToken,
  normalizeManittoMakerName,
} from '@/lib/manittoMakerShared'
import { guardMutation } from '@/lib/mutationGuard'
import { getRequestIdentity } from '@/lib/rateLimitKey'
import { isSafeMutationRequest } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RoomRow = {
  id: string
  code: string
  host_user_id: string
  host_name: string
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
    .select('id, code, host_user_id, host_name, title, note, capacity, status, drawn_at, expires_at')
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
    hostName?: string
    participants?: { id: string; name: string; invitePending: boolean }[]
    me?: { name: string; recipientName: string | null }
    tokenInvalid?: boolean
  } = {
    room: { code: room.code, title: room.title, note: room.note, capacity: room.capacity, status: room.status, drawnAt: room.drawn_at, expiresAt: room.expires_at },
    participantCount: count ?? 0,
    isHost: false,
  }

  const token = request.headers.get(MANITTO_MAKER_TOKEN_HEADER)
  if (token) {
    if (!isManittoMakerToken(token)) result.tokenInvalid = true
    else {
      const { data: participant, error: participantError } = await supabaseAdmin.from('manitto_maker_participants')
        .select('name, recipient_id')
        .eq('room_id', room.id)
        .eq('invite_pending', false)
        .eq('token_hash', digestToken(token))
        .maybeSingle<{ name: string; recipient_id: string | null }>()
      if (participantError) return Response.json({ error: '개인 참여 정보를 잠시 불러올 수 없어요.' }, { status: 503, headers: noStore })
      if (!participant) result.tokenInvalid = true
      else {
        let recipientName: string | null = null
        if (room.status === 'drawn' && participant.recipient_id) {
          const { data: recipient, error: recipientError } = await supabaseAdmin.from('manitto_maker_participants')
            .select('name').eq('id', participant.recipient_id).eq('room_id', room.id)
            .maybeSingle<{ name: string }>()
          if (recipientError) return Response.json({ error: '개인 결과를 잠시 불러올 수 없어요.' }, { status: 503, headers: noStore })
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
      result.hostName = room.host_name
      const { data: participants, error } = await supabaseAdmin.from('manitto_maker_participants')
        .select('id, name, invite_pending').eq('room_id', room.id).order('joined_at', { ascending: true }).limit(50)
        .returns<{ id: string; name: string; invite_pending: boolean }[]>()
      if (error) return Response.json({ error: '참가자 목록을 불러오지 못했습니다.' }, { status: 503, headers: noStore })
      result.participants = (participants ?? []).map((participant) => ({
        id: participant.id,
        name: participant.name,
        invitePending: participant.invite_pending,
      }))
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

  if (body?.action === 'claim') {
    const blocked = await guardMutation(request, {
      bucket: 'manitto-maker-claim',
      identity: `${room.id}:${getRequestIdentity(request)}`,
      limit: 80,
      windowSeconds: 60 * 60,
    })
    if (blocked) return blocked
    if (!isManittoMakerToken(body.inviteToken) || !isManittoMakerToken(body.guestToken) || body.inviteToken === body.guestToken) {
      return Response.json({ error: '개인 초대 링크를 다시 확인해주세요.' }, { status: 400, headers: noStore })
    }
    const { error } = await supabaseAdmin.rpc('claim_manitto_maker_invite', {
      p_room_id: room.id,
      p_invite_hash: digestToken(body.inviteToken),
      p_guest_hash: digestToken(body.guestToken),
    })
    if (error) return Response.json({ error: '이미 사용했거나 만료된 개인 초대예요. 방장에게 확인해주세요.' }, { status: 409, headers: noStore })
    return Response.json({ ok: true }, { headers: noStore })
  }

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

  if (['draw', 'remove', 'add', 'rename', 'invite'].includes(body?.action)) {
    const user = await getCommunityRequestUser(request)
    if (!user || user.id !== room.host_user_id) return Response.json({ error: '진행자 권한이 필요합니다.' }, { status: 403, headers: noStore })
    const blocked = await guardMutation(request, { bucket: 'manitto-maker-manage', identity: user.id, limit: 70, windowSeconds: 60 })
    if (blocked) return blocked
    if (body.action === 'draw') {
      const { data, error } = await supabaseAdmin.rpc('draw_manitto_maker_room', { p_room_id: room.id, p_host_user_id: user.id })
      if (error) return Response.json({ error: `추첨하지 못했습니다. 참가자가 ${MANITTO_MAKER_MIN_MEMBERS}명 이상인지, 이미 추첨했는지 확인해주세요.` }, { status: 409, headers: noStore })
      return Response.json({ ok: true, participantCount: data }, { headers: noStore })
    }

    const participantId = typeof body.participantId === 'string' ? body.participantId : ''
    if (body.action !== 'add' && !uuidPattern.test(participantId)) return Response.json({ error: '참가자를 선택해주세요.' }, { status: 400, headers: noStore })
    if (body.action === 'remove') {
      const { error } = await supabaseAdmin.rpc('remove_manitto_maker_participant', {
        p_room_id: room.id,
        p_host_user_id: user.id,
        p_participant_id: participantId,
      })
      if (error) return Response.json({ error: '참가자를 제외하지 못했습니다. 추첨 상태를 확인해주세요.' }, { status: 409, headers: noStore })
      return Response.json({ ok: true }, { headers: noStore })
    }

    const name = typeof body.name === 'string' ? normalizeManittoMakerName(body.name) : ''
    if (body.action !== 'invite' && !isManittoMakerName(name)) {
      return Response.json({ error: '참가자 이름을 1~24자로 입력해주세요.' }, { status: 400, headers: noStore })
    }

    // The add action's credential is never returned to the client. Organizer
    // chooses "개인 초대" explicitly at share-time and the previous link is replaced.
    const inviteToken = body.action !== 'rename' ? randomBytes(32).toString('base64url') : null
    const { error } = await supabaseAdmin.rpc('manage_manitto_maker_roster', {
      p_room_id: room.id,
      p_host_user_id: user.id,
      p_action: body.action,
      p_name: name || null,
      p_participant_id: participantId || null,
      p_token_hash: inviteToken ? digestToken(inviteToken) : null,
    })
    if (error?.code === '23505') return Response.json({ error: '같은 이름이 있어요. 구분할 수 있는 별명을 사용해주세요.' }, { status: 409, headers: noStore })
    if (error) return Response.json({ error: body.action === 'invite' ? '이미 등록된 참가자이거나 초대를 만들 수 없어요.' : '명단을 수정할 수 없어요. 모집 인원과 추첨 상태를 확인해주세요.' }, { status: 409, headers: noStore })
    return Response.json({ ok: true, ...(body.action === 'invite' ? { inviteToken } : {}) }, { headers: noStore })
  }

  return Response.json({ error: '지원하지 않는 요청입니다.' }, { status: 400, headers: noStore })
}
