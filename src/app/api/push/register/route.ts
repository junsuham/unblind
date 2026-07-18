import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/mutationGuard'

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'push-register',
    identity: user.id,
    limit: 12,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  const platform = body?.platform === 'ios' || body?.platform === 'android' ? body.platform : null
  const deviceName = typeof body?.deviceName === 'string' ? body.deviceName.trim().slice(0, 100) : null

  if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
    return Response.json({ error: '유효하지 않은 알림 토큰입니다.' }, { status: 400 })
  }
  if (!platform) return Response.json({ error: '기기 유형을 확인하지 못했습니다.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('push_tokens').upsert({
    token,
    user_id: user.id,
    platform,
    device_name: deviceName,
    is_active: true,
    updated_at: new Date().toISOString(),
  })

  if (error) return Response.json({ error: '알림 기기를 등록하지 못했습니다.' }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'push-register',
    identity: user.id,
    limit: 12,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  if (!token) return Response.json({ error: '알림 토큰이 없습니다.' }, { status: 400 })

  await supabaseAdmin
    .from('push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('token', token)

  return Response.json({ ok: true })
}
