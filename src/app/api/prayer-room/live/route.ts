import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { parsePrayerRoomMessage, parsePrayerRoomPosition, type PrayerRoomSnapshot } from '@/lib/prayerRoomLive'
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
  if (body?.leave === true) {
    const { error } = await supabaseAdmin.from('prayer_room_presence').delete().eq('user_id', user.id)
    return Response.json({ ok: !error }, { status: error ? 503 : 200, headers })
  }
  const position = parsePrayerRoomPosition(body?.position)
  const hasChat = body?.chat !== undefined
  const chat = hasChat ? parsePrayerRoomMessage(body.chat) : null
  if (!position || (hasChat && !chat)) {
    return Response.json({ error: '메시지는 160자 이하로 입력하고 연락처와 링크는 빼주세요.' }, { status: 400, headers })
  }
  const { data, error } = await supabaseAdmin.rpc('exchange_prayer_room_state', {
    p_user_id: user.id,
    p_x: position.x,
    p_y: position.y,
    p_facing: position.facing,
    p_avatar_id: position.avatarId,
    p_chat: chat,
  }).returns<PrayerRoomSnapshot>()

  if (error || !data) {
    if (error?.code !== '42501') console.error('Prayer room live unavailable:', error?.code)
    return Response.json({ error: '기도의 방에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' }, {
      status: error?.code === '42501' ? 403 : 503, headers,
    })
  }
  return Response.json(data, { headers })
}
