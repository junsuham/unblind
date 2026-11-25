import { CHURCH_INFO_CONSENT_VERSION } from '@/lib/agreement'
import { CHURCH_DASHBOARD_TARGET_PLACE_ID } from '@/lib/churchDashboardScope'
import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const headers = { 'Cache-Control': 'private, no-store' }

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) {
    return Response.json({ error: '승인된 Google 계정으로 로그인해 주세요.' }, { status: 401, headers })
  }

  const blocked = await guardMutation(request, { bucket: 'church-info-consent', identity: user.id, limit: 6, windowSeconds: 60 })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  if (body?.accepted !== true || body?.version !== CHURCH_INFO_CONSENT_VERSION) {
    return Response.json({ error: '교회 정보 이용 안내를 읽고 동의 항목을 선택해 주세요.' }, { status: 400, headers })
  }

  const { data: profile, error: profileError } = await supabaseAdmin.from('user_profiles')
    .select('church_place_id, church_info_consent_at')
    .eq('user_id', user.id)
    .maybeSingle<{ church_place_id: string, church_info_consent_at: string | null }>()
  if (profileError) {
    return Response.json({ error: '등록된 교회 정보를 불러오지 못했습니다.' }, { status: 503, headers })
  }
  if (profile?.church_place_id !== CHURCH_DASHBOARD_TARGET_PLACE_ID) {
    return Response.json({ error: '이 계정에서 확인할 교회 정보가 없습니다.' }, { status: 409, headers })
  }
  if (profile.church_info_consent_at) return Response.json({ ok: true }, { headers })

  const now = new Date().toISOString()
  const { data: changed, error: updateError } = await supabaseAdmin.from('user_profiles')
    .update({
      church_info_consent_at: now,
      church_info_consent_version: CHURCH_INFO_CONSENT_VERSION,
      updated_at: now,
    })
    .eq('user_id', user.id)
    .eq('church_place_id', CHURCH_DASHBOARD_TARGET_PLACE_ID)
    .is('church_info_consent_at', null)
    .select('church_info_consent_at')
    .maybeSingle()
  if (updateError) {
    return Response.json({ error: '동의를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503, headers })
  }
  if (!changed) {
    return Response.json({ error: '가입 정보가 바뀌었습니다. 내 정보를 새로고침해 확인해 주세요.' }, { status: 409, headers })
  }

  return Response.json({ ok: true }, { headers })
}
