import { getCommunityRequestUser } from '@/lib/communityRequestUser'
import {
  getKoreaDate,
  getMonthRange,
  isYearMonth,
} from '@/lib/dailyFaith'
import { guardMutation } from '@/lib/mutationGuard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type GratitudePreferenceRow = {
  user_id: string
}

export async function GET(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const requestedMonth = new URL(request.url).searchParams.get('month') ?? getKoreaDate().slice(0, 7)
  if (!isYearMonth(requestedMonth)) {
    return Response.json({ error: '조회할 달을 확인해주세요.' }, { status: 400 })
  }

  const { start, end } = getMonthRange(requestedMonth)
  const [
    { data: preference, error: preferenceError },
    { data: entries, error: entriesError },
    { data: received, error: receivedError },
  ] = await Promise.all([
    supabaseAdmin
      .from('gratitude_preferences')
      .select('challenge_enabled')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabaseAdmin
      .from('gratitude_entries')
      .select('id, entry_date, content, challenge_enabled, gratitude_voice, delivered_at, created_at')
      .eq('user_id', user.id)
      .gte('entry_date', start)
      .lte('entry_date', end)
      .order('entry_date', { ascending: false }),
    supabaseAdmin
      .from('gratitude_entries')
      .select('id, entry_date, content, gratitude_voice, delivered_at')
      .eq('recipient_user_id', user.id)
      .not('delivered_at', 'is', null)
      .order('delivered_at', { ascending: false })
      .limit(20),
  ])

  const error = preferenceError ?? entriesError ?? receivedError
  if (error) {
    console.error('Gratitude journal read failed:', error.message)
    return Response.json({ error: '감사 기록을 불러오지 못했습니다.' }, { status: 500 })
  }

  return Response.json({
    challengeEnabled: preference?.challenge_enabled ?? false,
    entries: entries ?? [],
    received: (received ?? []).map((entry) => ({
      ...entry,
      sender: '익명의 감사 친구',
    })),
  })
}

export async function POST(request: Request) {
  const user = await getCommunityRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const blocked = await guardMutation(request, {
    bucket: 'gratitude-journal',
    identity: user.id,
    limit: 8,
    windowSeconds: 60,
  })
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  const challengeEnabled = body?.challengeEnabled === true
  const gratitudeVoice = typeof body?.gratitudeVoice === 'string'
    ? body.gratitudeVoice.trim()
    : ''

  if (!content || content.length > 280) {
    return Response.json({ error: '오늘의 감사는 1자 이상 280자 이하로 적어주세요.' }, { status: 400 })
  }
  if (challengeEnabled && (!gratitudeVoice || gratitudeVoice.length > 280)) {
    return Response.json({ error: '다음 사람에게 전할 감사의 목소리를 적어주세요.' }, { status: 400 })
  }

  const { error: preferenceError } = await supabaseAdmin
    .from('gratitude_preferences')
    .upsert({
      user_id: user.id,
      challenge_enabled: challengeEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (preferenceError) {
    console.error('Gratitude preference update failed:', preferenceError.message)
    return Response.json({ error: '챌린지 설정을 저장하지 못했습니다.' }, { status: 500 })
  }

  let recipientUserId: string | null = null
  if (challengeEnabled) {
    const { data: participants, error: participantError } = await supabaseAdmin
      .from('gratitude_preferences')
      .select('user_id')
      .eq('challenge_enabled', true)
      .neq('user_id', user.id)
      .returns<GratitudePreferenceRow[]>()

    if (participantError) {
      console.error('Gratitude recipient selection failed:', participantError.message)
      return Response.json({ error: '감사 친구를 찾지 못했습니다.' }, { status: 500 })
    }
    if (participants?.length) {
      recipientUserId = participants[Math.floor(Math.random() * participants.length)].user_id
    }
  }

  const entryDate = getKoreaDate()
  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('gratitude_entries')
    .upsert({
      user_id: user.id,
      entry_date: entryDate,
      content,
      challenge_enabled: challengeEnabled,
      gratitude_voice: challengeEnabled ? gratitudeVoice : null,
      recipient_user_id: recipientUserId,
      delivered_at: recipientUserId ? now : null,
      updated_at: now,
    }, { onConflict: 'user_id,entry_date' })
    .select('id, entry_date, content, challenge_enabled, gratitude_voice, delivered_at, created_at')
    .single()

  if (error) {
    console.error('Gratitude entry save failed:', error.message)
    return Response.json({ error: '오늘의 감사를 저장하지 못했습니다.' }, { status: 500 })
  }

  return Response.json({
    entry: data,
    delivery: challengeEnabled
      ? recipientUserId
        ? 'delivered'
        : 'waiting'
      : 'private',
  })
}
