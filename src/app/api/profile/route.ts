import { NextResponse } from 'next/server'
import { searchChurches } from '@/lib/churchSearch'
import {
  generateBiblicalNickname,
  getReferenceAge,
  isEligibleReferenceAge,
  isOccupation,
} from '@/lib/profile'
import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  const user = await getRequestUser(request)

  if (!user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const birthDate = typeof body?.birthDate === 'string' ? body.birthDate : ''
  const occupation = body?.occupation
  const churchPlaceId =
    typeof body?.churchPlaceId === 'string' ? body.churchPlaceId : ''
  const churchName =
    typeof body?.churchName === 'string' ? body.churchName.trim() : ''
  const churchAddress =
    typeof body?.churchAddress === 'string' ? body.churchAddress.trim() : ''

  const referenceAge = getReferenceAge(birthDate)

  if (!isEligibleReferenceAge(referenceAge)) {
    return NextResponse.json(
      {
        code: 'AGE_RESTRICTED',
        error: '2026년도 기준 20세 이상 59세 이하만 가입할 수 있습니다.',
      },
      { status: 403 }
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
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  return NextResponse.json({ ok: true })
}
