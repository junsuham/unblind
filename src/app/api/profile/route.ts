import { NextResponse } from 'next/server'
import { searchChurches } from '@/lib/churchSearch'
import {
  generateBiblicalNickname,
  isEligibleReferenceAge,
  isOccupation,
} from '@/lib/profile'
import { getVerifiedSocialAge } from '@/lib/socialAge'
import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { guardMutation } from '@/lib/mutationGuard'
import { AGREEMENT_VERSION } from '@/lib/agreement'

export async function POST(request: Request) {
  const user = await getRequestUser(request)

  if (!user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const blocked = await guardMutation(request, {
    bucket: 'profile-save',
    identity: user.id,
    limit: 10,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const occupation = body?.occupation
  const agreementAccepted = body?.agreementAccepted === true
  const churchPlaceId =
    typeof body?.churchPlaceId === 'string' ? body.churchPlaceId : ''
  const churchName =
    typeof body?.churchName === 'string' ? body.churchName.trim() : ''
  const churchAddress =
    typeof body?.churchAddress === 'string' ? body.churchAddress.trim() : ''

  const verifiedAge = getVerifiedSocialAge(user)
  const birthDate = verifiedAge?.birthDate ?? ''
  const referenceAge = verifiedAge?.referenceAge ?? null

  if (!agreementAccepted) {
    return NextResponse.json(
      {
        code: 'AGREEMENT_REQUIRED',
        error: '앱 이용 안내와 개인정보 처리 내용을 모두 확인해주세요.',
      },
      { status: 400 }
    )
  }

  if (!isEligibleReferenceAge(referenceAge)) {
    return NextResponse.json(
      {
        code: 'AGE_RESTRICTED',
        error: 'Google 계정의 연령 확인이 필요합니다. 다시 로그인해주세요.',
      },
      { status: 400 }
    )
  }

  if (!isOccupation(occupation)) {
    return NextResponse.json(
      { error: '현재 상태를 선택해주세요.' },
      { status: 400 }
    )
  }

  if (!churchPlaceId || !churchName || !churchAddress) {
    return NextResponse.json(
      { error: '검색 결과에서 출석 교회를 선택해주세요.' },
      { status: 400 }
    )
  }

  let verifiedChurch

  try {
    const churchResults = await searchChurches(
      `${churchName} ${churchAddress}`
    )
    verifiedChurch = churchResults.find((church) => church.id === churchPlaceId)
  } catch (error) {
    console.error('Church verification failed:', error)

    return NextResponse.json(
      { error: '교회 정보를 확인하지 못했습니다. 다시 검색해주세요.' },
      { status: 502 }
    )
  }

  if (!verifiedChurch) {
    return NextResponse.json(
      { error: '유효한 교회 검색 결과를 선택해주세요.' },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('user_profiles').upsert(
    {
      user_id: user.id,
      email: user.email.toLowerCase(),
      nickname: generateBiblicalNickname(user.id),
      birth_date: birthDate,
      reference_age: referenceAge,
      church_place_id: verifiedChurch.id,
      church_name: verifiedChurch.name,
      church_address: verifiedChurch.roadAddress || verifiedChurch.address,
      church_place_url: verifiedChurch.placeUrl,
      occupation,
      agreed_at: now,
      agreed_version: AGREEMENT_VERSION,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Profile save failed:', error)

    return NextResponse.json(
      { error: '프로필을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }

  const { error: agreementSyncError } = await supabaseAdmin
    .from('allowed_users')
    .update({
      agreed_at: now,
      agreed_version: AGREEMENT_VERSION,
      updated_at: now,
    })
    .ilike('email', user.email)
    .eq('status', 'active')

  if (agreementSyncError) {
    console.warn('Profile agreement sync failed:', agreementSyncError.message)
  }

  return NextResponse.json({ ok: true })
}
