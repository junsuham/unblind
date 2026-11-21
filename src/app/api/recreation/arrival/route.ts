import { randomBytes } from 'node:crypto'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('recreation_arrival_rooms')
    .select('room_code, title, appointment_at, expires_at, created_at')
    .eq('organizer_user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) {
    console.error('Arrival room list failed:', error.message)
    return Response.json({ error: '모임 목록을 불러오지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ rooms: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'recreation-arrival-create',
    identity: user.id,
    limit: 5,
    windowSeconds: 3600,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim().replace(/\s+/g, ' ') : ''
  const appointmentAt = typeof body?.appointmentAt === 'string' ? Date.parse(body.appointmentAt) : NaN
  const now = Date.now()

  if (title.length < 2 || title.length > 80) {
    return Response.json({ error: '모임 제목을 2~80자로 입력해주세요.' }, { status: 400 })
  }
  if (!Number.isFinite(appointmentAt) || appointmentAt < now - 60000 || appointmentAt > now + 30 * 86400000) {
    return Response.json({ error: '약속 시간은 지금부터 30일 이내로 설정해주세요.' }, { status: 400 })
  }

  const roomCode = randomBytes(16).toString('hex')
  const { error } = await supabaseAdmin.from('recreation_arrival_rooms').insert({
    room_code: roomCode,
    organizer_user_id: user.id,
    title,
    appointment_at: new Date(appointmentAt).toISOString(),
    expires_at: new Date(Math.max(now + 86400000, appointmentAt + 2 * 86400000)).toISOString(),
  })

  if (error) {
    console.error('Arrival room creation failed:', error.message)
    return Response.json({ error: '모임 링크를 만들지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ roomCode }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
