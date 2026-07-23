import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import {
  getKoreaDate,
  isFaithMood,
  isFaithWeather,
} from '@/lib/dailyFaith'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const checkinDate = getKoreaDate()
  const { data, error } = await supabaseAdmin
    .from('faith_checkins')
    .select('mood, faith_weather, checkin_date')
    .eq('user_id', user.id)
    .eq('checkin_date', checkinDate)
    .maybeSingle()

  if (error) {
    console.error('Faith check-in read failed:', error.message)
    return Response.json({ error: '오늘의 체크인을 확인하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ checkin: data ?? null })
}

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'faith-checkin',
    identity: user.id,
    limit: 4,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const mood = body?.mood
  const faithWeather = body?.faithWeather
  if (!isFaithMood(mood) || !isFaithWeather(faithWeather)) {
    return Response.json({ error: '마음과 신앙 날씨를 모두 선택해주세요.' }, { status: 400 })
  }

  const checkinDate = getKoreaDate()
  const { data, error } = await supabaseAdmin
    .from('faith_checkins')
    .insert({
      user_id: user.id,
      checkin_date: checkinDate,
      mood,
      faith_weather: faithWeather,
    })
    .select('mood, faith_weather, checkin_date')
    .single()

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: '오늘의 체크인은 이미 완료했어요.' }, { status: 409 })
    }
    console.error('Faith check-in creation failed:', error.message)
    return Response.json({ error: '체크인을 저장하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({ checkin: data })
}
