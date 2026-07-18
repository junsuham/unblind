import { getRequestUser } from '@/lib/requestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'notifications-read',
    identity: user.id,
    limit: 30,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const notificationId = typeof body?.id === 'string' ? body.id.trim() : ''
  const markAll = body?.all === true

  if (!markAll && !/^[0-9a-f-]{36}$/i.test(notificationId)) {
    return Response.json({ error: '알림을 확인하지 못했습니다.' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (!markAll) query = query.eq('id', notificationId)

  const { error } = await query
  if (error) {
    console.error('Notification read update failed:', error.message)
    return Response.json({ error: '알림 상태를 저장하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
