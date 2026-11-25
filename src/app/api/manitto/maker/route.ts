import { randomBytes } from 'node:crypto'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { isManittoMakerCapacity, isManittoMakerTitle } from '@/lib/manittoMakerShared'
import { isSafeMutationRequest } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RoomListRow = {
  code: string
  title: string
  capacity: number
  status: 'open' | 'drawn'
  created_at: string
  expires_at: string
  manitto_maker_participants: { count: number }[]
}

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인한 승인 회원만 방을 만들 수 있습니다.' }, { status: 403, headers: noStore })

  const { data, error } = await supabaseAdmin
    .from('manitto_maker_rooms')
    .select('code, title, capacity, status, created_at, expires_at, manitto_maker_participants(count)')
    .eq('host_user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(30)
    .returns<RoomListRow[]>()

  if (error) return Response.json({ error: '내 모임을 불러오지 못했습니다.' }, { status: 503, headers: noStore })
  return Response.json({ rooms: (data ?? []).map((room) => ({
    code: room.code,
    title: room.title,
    capacity: room.capacity,
    status: room.status,
    participantCount: room.manitto_maker_participants?.[0]?.count ?? 0,
    createdAt: room.created_at,
    expiresAt: room.expires_at,
  })) }, { headers: noStore })
}

export async function POST(request: Request) {
  if (!isSafeMutationRequest(request)) {
    return Response.json({ error: '요청 출처를 확인할 수 없습니다.' }, { status: 403, headers: noStore })
  }
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인한 승인 회원만 방을 만들 수 있습니다.' }, { status: 403, headers: noStore })
  const blocked = await guardMutation(request, { bucket: 'manitto-maker-create', identity: user.id, limit: 5, windowSeconds: 60 * 60 })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim().replace(/\s+/g, ' ') : ''
  const note = typeof body?.note === 'string' ? body.note.trim() : ''
  const capacity = Number(body?.capacity)
  if (!isManittoMakerTitle(title) || !isManittoMakerCapacity(capacity) || note.length > 200 || /[\p{Cc}\p{Cf}]/u.test(note)) {
    return Response.json({ error: '모임 이름(2~60자), 인원(3~50명), 안내(200자 이하)를 확인해주세요.' }, { status: 400, headers: noStore })
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = randomBytes(9).toString('base64url')
    const { data, error } = await supabaseAdmin.from('manitto_maker_rooms')
      .insert({ code, host_user_id: user.id, title, note, capacity })
      .select('code')
      .single<{ code: string }>()
    if (!error && data) return Response.json({ code: data.code }, { status: 201, headers: noStore })
    if (error?.code !== '23505') {
      console.error('manitto_maker_create_failed', error?.code)
      return Response.json({ error: '모임을 만들지 못했습니다.' }, { status: 503, headers: noStore })
    }
  }
  return Response.json({ error: '모임 코드를 만들지 못했습니다. 다시 시도해주세요.' }, { status: 503, headers: noStore })
}
