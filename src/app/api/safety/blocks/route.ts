import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/mutationGuard'

function getBlockedUserId(body: unknown) {
  if (!body || typeof body !== 'object') return ''
  const value = (body as { blockedUserId?: unknown }).blockedUserId
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'user-block',
    identity: user.id,
    limit: 20,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const blockedUserId = getBlockedUserId(await request.json().catch(() => null))
  if (!blockedUserId || blockedUserId === user.id) {
    return Response.json({ error: '차단할 사용자를 확인하지 못했습니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('user_blocks').upsert(
    { blocker_user_id: user.id, blocked_user_id: blockedUserId },
    { onConflict: 'blocker_user_id,blocked_user_id', ignoreDuplicates: true }
  )

  if (error) return Response.json({ error: '사용자를 차단하지 못했습니다.' }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'user-block',
    identity: user.id,
    limit: 20,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const blockedUserId = getBlockedUserId(await request.json().catch(() => null))
  if (!blockedUserId) {
    return Response.json({ error: '차단 해제할 사용자를 확인하지 못했습니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('user_blocks')
    .delete()
    .eq('blocker_user_id', user.id)
    .eq('blocked_user_id', blockedUserId)

  if (error) return Response.json({ error: '사용자 차단을 해제하지 못했습니다.' }, { status: 500 })
  return Response.json({ ok: true })
}
