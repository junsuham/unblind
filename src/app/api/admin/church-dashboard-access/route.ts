import type { NextRequest } from 'next/server'
import { isAdminUser } from '@/lib/adminRole'
import { getRequestUser } from '@/lib/requestUser'
import { isSafeMutationRequest } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

type GrantBody = {
  action?: unknown
  userId?: unknown
  scope?: unknown
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  if (!isSafeMutationRequest(request)) {
    return Response.json({ error: '요청 출처를 확인할 수 없습니다.' }, { status: 403 })
  }

  // The shared admin_session cookie alone is deliberately insufficient for
  // granting access to potentially sensitive church operations data.
  const actor = await getRequestUser(request)
  if (!actor || !(await isAdminUser(actor))) {
    return Response.json({ error: '로그인한 관리자 계정이 필요합니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as GrantBody | null
  const action = body?.action
  const userId = body?.userId
  const scope = body?.scope
  if ((action !== 'grant' && action !== 'revoke') || typeof userId !== 'string' || !uuidPattern.test(userId)) {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  if (action === 'grant' && scope !== 'church' && scope !== 'department') {
    return Response.json({ error: '접근 범위를 선택해 주세요.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.rpc('set_church_dashboard_access', {
    p_actor_user_id: actor.id,
    p_target_user_id: userId,
    p_action: action,
    p_scope: action === 'grant' ? scope : null,
  })

  // The RPC commits role and audit together. On any error neither is applied.
  if (error) {
    console.error('church_dashboard_access_change_failed', error.code)
    return Response.json({ error: '대시보드 권한을 변경하지 못했습니다. 가입 정보와 관리자 권한을 확인해 주세요.' }, { status: 400 })
  }

  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
