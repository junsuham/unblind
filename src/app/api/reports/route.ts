import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const reasons = new Set(['personal_info', 'attack', 'sexual', 'cult', 'money', 'self_harm', 'spam', 'other'])

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '신고를 접수할 권한이 없습니다.' }, { status: 403 })

  const blocked = await guardMutation(request, {
    bucket: 'report-create',
    identity: user.id,
    limit: 10,
    windowSeconds: 60 * 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const targetType = body?.targetType === 'post' || body?.targetType === 'comment' ? body.targetType : null
  const targetId = typeof body?.targetId === 'string' ? body.targetId.trim() : ''
  const reason = typeof body?.reason === 'string' && reasons.has(body.reason) ? body.reason : null
  const detail = typeof body?.detail === 'string' ? body.detail.trim().slice(0, 500) : ''

  if (!targetType || !/^[0-9a-f-]{36}$/i.test(targetId) || !reason) {
    return Response.json({ error: '신고 정보를 확인하지 못했습니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('reports').insert({
    target_type: targetType,
    target_id: targetId,
    reporter_actor_key: user.id,
    reporter_user_id: user.id,
    reporter_email: user.email?.toLowerCase() ?? null,
    reason,
    detail: detail || null,
    status: 'pending',
  })

  if (error?.code === '23505') return Response.json({ ok: true, duplicate: true })
  if (error) {
    console.error('Report creation failed:', error.message)
    return Response.json({ error: '신고를 접수하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
