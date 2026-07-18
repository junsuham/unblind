import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function getSubscription(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const input = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : ''
  const p256dh = typeof input.keys?.p256dh === 'string' ? input.keys.p256dh.trim() : ''
  const auth = typeof input.keys?.auth === 'string' ? input.keys.auth.trim() : ''

  if (!endpoint.startsWith('https://') || endpoint.length > 2048) return null
  if (!/^[A-Za-z0-9_-]{40,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{10,100}$/.test(auth)) return null
  return { endpoint, p256dh, auth }
}

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '푸시 알림을 등록할 권한이 없습니다.' }, { status: 403 })
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return Response.json({ error: '웹 푸시가 아직 준비되지 않았습니다.' }, { status: 503 })
  }

  const blocked = await guardMutation(request, {
    bucket: 'web-push-subscribe',
    identity: user.id,
    limit: 10,
    windowSeconds: 10 * 60,
  })
  if (blocked) return blocked

  const subscription = getSubscription(await request.json().catch(() => null))
  if (!subscription) return Response.json({ error: '알림 구독 정보를 확인하지 못했습니다.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('web_push_subscriptions').upsert({
    user_id: user.id,
    ...subscription,
    user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('Web push subscription failed:', error.message)
    return Response.json({ error: '푸시 알림을 등록하지 못했습니다.' }, { status: 500 })
  }

  await supabaseAdmin.from('notification_preferences').upsert({
    user_id: user.id,
    push_enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'web-push-subscribe',
    identity: user.id,
    limit: 10,
    windowSeconds: 10 * 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : ''
  if (!endpoint.startsWith('https://') || endpoint.length > 2048) return Response.json({ error: '알림 구독 정보를 확인하지 못했습니다.' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('web_push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) return Response.json({ error: '푸시 알림을 해제하지 못했습니다.' }, { status: 500 })
  return Response.json({ ok: true })
}
