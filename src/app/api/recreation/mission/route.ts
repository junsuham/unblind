import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isMissionCategory, isMissionMode } from '@/app/recreation/mission/missionCards'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '모임을 만들려면 로그인과 가입 승인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'recreation-mission-create',
    identity: user.id,
    limit: 5,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const mode = body?.mode
  const category = body?.category
  const teamCount = Number(body?.teamCount)
  if (!isMissionMode(mode) || !isMissionCategory(category)) {
    return Response.json({ error: '경기 방식과 미션 종류를 선택해주세요.' }, { status: 400 })
  }
  if (mode === 'team' && (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > 8)) {
    return Response.json({ error: '팀 수는 2개부터 8개까지 선택할 수 있습니다.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('recreation_mission_rooms')
    .insert({ host_user_id: user.id, mode, category, team_count: mode === 'team' ? teamCount : 0 })
    .select('id')
    .single()
  if (error || !data) {
    console.error('Mission room creation failed:', error?.message)
    return Response.json({ error: '모임을 만들지 못했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  return Response.json({ id: data.id }, { status: 201 })
}
