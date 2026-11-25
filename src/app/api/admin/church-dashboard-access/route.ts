import type { NextRequest } from 'next/server'
import { isAdminUser } from '@/lib/adminRole'
import {
  CHURCH_DASHBOARD_TARGET_DEPARTMENT,
  churchDashboardGrantBlockers,
  getChurchDashboardGrantBlocker,
} from '@/lib/churchDashboardScope'
import { getRequestUser } from '@/lib/requestUser'
import { isSafeMutationRequest } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

type GrantBody = {
  action?: unknown
  userId?: unknown
  scope?: unknown
  department?: unknown
  verifiedMembership?: unknown
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  if (!isSafeMutationRequest(request)) {
    return Response.json({ error: '요청 출처를 확인할 수 없습니다.' }, { status: 403 })
  }

  // The shared admin_session cookie alone is deliberately insufficient for
  // granting access to potentially sensitive church operations data.
  const actor = await getRequestUser(request)
  if (actor?.app_metadata?.provider !== 'google' || !(await isAdminUser(actor))) {
    return Response.json({ error: 'Google 관리자 계정으로 로그인해야 대시보드 권한을 변경할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null) as GrantBody | null
  const action = body?.action
  const userId = body?.userId
  const scope = body?.scope
  const department = body?.department
  if ((action !== 'grant' && action !== 'revoke') || typeof userId !== 'string' || !uuidPattern.test(userId)) {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  if (action === 'grant' && (scope !== 'verified_2bu' || department !== CHURCH_DASHBOARD_TARGET_DEPARTMENT)) {
    return Response.json({ error: '연세중앙교회 2부 권한만 부여할 수 있습니다.' }, { status: 400 })
  }
  if (action === 'grant') {
    if (body?.verifiedMembership !== true) {
      return Response.json({ error: '대상자의 실제 2부 소속을 확인했다는 항목을 선택해 주세요.' }, { status: 400 })
    }

    const [authResult, profileResult] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.from('user_profiles')
        .select('completed_at, church_info_consent_at, reference_age, church_place_id, church_name, church_department')
        .eq('user_id', userId)
        .maybeSingle<{
          completed_at: string | null, church_info_consent_at: string | null,
          reference_age: number | null, church_place_id: string | null,
          church_name: string | null, church_department: string | null,
        }>(),
    ])
    const member = authResult.data?.user
    if (profileResult.error || (authResult.error && authResult.error.status !== 404)) {
      return Response.json({ error: '가입 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 })
    }
    if (!member?.email || member.app_metadata?.provider !== 'google') {
      return Response.json({ code: 'account', error: churchDashboardGrantBlockers.account }, { status: 422 })
    }

    const { data: allowed, error: approvalError } = await supabaseAdmin.from('allowed_users')
      .select('status, agreed_at').eq('email', member.email.trim().toLowerCase())
      .maybeSingle<{ status: string, agreed_at: string | null }>()
    if (approvalError) {
      return Response.json({ error: '가입 승인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 })
    }

    const profile = profileResult.data
    const blocker = getChurchDashboardGrantBlocker({
      isGoogleMember: true,
      isApprovedAndAgreed: allowed?.status === 'active' && Boolean(allowed.agreed_at),
      profile: {
        complete: Boolean(profile?.completed_at),
        hasChurchConsent: Boolean(profile?.church_info_consent_at),
        referenceAge: profile?.reference_age ?? null,
        churchPlaceId: profile?.church_name?.trim() ? profile.church_place_id : null,
        churchDepartment: profile?.church_department ?? null,
      },
    })
    if (blocker) return Response.json({ code: blocker, error: churchDashboardGrantBlockers[blocker] }, { status: 422 })
  }

  const { error } = await supabaseAdmin.rpc('set_church_dashboard_access_v2', {
    p_actor_user_id: actor.id,
    p_target_user_id: userId,
    p_action: action,
    p_scope: action === 'grant' ? scope : null,
    p_department: action === 'grant' ? CHURCH_DASHBOARD_TARGET_DEPARTMENT : null,
  })

  // The RPC commits role and audit together. On any error neither is applied.
  if (error) {
    console.error('church_dashboard_access_change_failed', error.code)
    if (error.code === 'P0001') {
      return Response.json({ error: '대시보드 권한을 변경하지 못했습니다. 관리자와 대상자의 상태를 새로고침해 확인해 주세요.' }, { status: 409 })
    }
    return Response.json({ error: '권한 변경을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 })
  }

  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
