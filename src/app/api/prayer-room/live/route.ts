import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import {
  parsePrayerRoomMessage, parsePrayerRoomPosition, parsePrayerRoomVisitId,
  prayerRoomLiveVersion, type PrayerRoomSnapshot,
} from '@/lib/prayerRoomLive'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const headers = { 'Cache-Control': 'private, no-store' }

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '승인된 계정으로 로그인해주세요.' }, { status: 401, headers })
  const blocked = await guardMutation(request, {
    bucket: 'prayer-room-live', identity: user.id, limit: 38, windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  if (body?.roomVersion !== undefined && body.roomVersion !== prayerRoomLiveVersion) {
    return Response.json({ error: '앱을 새로 열고 다시 시도해주세요.' }, { status: 400, headers })
  }
  const roomVersion = body?.roomVersion === prayerRoomLiveVersion ? prayerRoomLiveVersion : 1
  const visitId = parsePrayerRoomVisitId(body?.visitId)
  if (roomVersion === prayerRoomLiveVersion && !visitId) {
    return Response.json({ error: '기도의 방 입장 정보를 확인할 수 없어요.' }, { status: 400, headers })
  }
  if (body?.leave === true) {
    const row = supabaseAdmin.from('prayer_room_presence').delete()
      .eq('user_id', user.id).eq('world_version', roomVersion)
    const { error } = await (visitId && roomVersion === prayerRoomLiveVersion ? row.eq('visit_id', visitId) : row)
    return Response.json({ ok: !error }, { status: error ? 503 : 200, headers })
  }
  const position = parsePrayerRoomPosition(body?.position, roomVersion)
  const hasChat = body?.chat !== undefined
  const chat = hasChat ? parsePrayerRoomMessage(body.chat) : null
  if (!position) {
    return Response.json({ error: '기도의 방에서 캐릭터 위치를 확인할 수 없어요.' }, { status: 400, headers })
  }
  if (hasChat && !chat) {
    return Response.json({ error: '메시지는 160자 이하로 입력하고 연락처와 링크는 빼주세요.' }, { status: 400, headers })
  }
  const exchange = {
    p_user_id: user.id,
    p_x: position.x,
    p_y: position.y,
    p_facing: position.facing,
    p_avatar_id: position.avatarId,
    p_chat: chat,
  }
  const query = roomVersion === prayerRoomLiveVersion
    ? supabaseAdmin.rpc('exchange_prayer_room_state_v2', {
      ...exchange,
      p_visit_id: visitId,
      p_is_praying: position.isPraying ?? false,
    })
    : supabaseAdmin.rpc('exchange_prayer_room_state', exchange)
  const { data, error } = await query.returns<PrayerRoomSnapshot>()

  if (error || !data) {
    if (error?.code !== '42501') console.error('Prayer room live unavailable:', error?.code)
    return Response.json({ error: '기도의 방에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' }, {
      status: error?.code === '42501' ? 403 : 503, headers,
    })
  }
  return Response.json(data, { headers })
}
