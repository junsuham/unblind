import 'server-only'

import { createHmac } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type EligibleProfile = {
  user_id: string
  email: string
  nickname: string
  completed_at: string
}

type AllowedMember = {
  email: string
}

export type WeeklyManitto = {
  weekKey: string
  startsOn: string
  endsOn: string
  participantCount: number
  recipientNickname: string | null
}

function getSeoulWeek() {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = Number(dateParts.find((part) => part.type === 'year')?.value)
  const month = Number(dateParts.find((part) => part.type === 'month')?.value)
  const day = Number(dateParts.find((part) => part.type === 'day')?.value)
  const todayUtc = Date.UTC(year, month - 1, day)
  const weekday = new Date(todayUtc).getUTCDay()
  const daysSinceMonday = (weekday + 6) % 7
  const monday = new Date(todayUtc - daysSinceMonday * 86_400_000)
  const sunday = new Date(monday.getTime() + 6 * 86_400_000)

  const toKey = (date: Date) => date.toISOString().slice(0, 10)
  const toKoreanDate = (date: Date) =>
    `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`

  return {
    weekKey: toKey(monday),
    startsOn: toKoreanDate(monday),
    endsOn: toKoreanDate(sunday),
  }
}

function getShuffleScore(weekKey: string, userId: string) {
  const secret =
    process.env.ADMIN_SESSION_TOKEN ??
    process.env.SUPABASE_SECRET_KEY ??
    'unblind-manitto'

  return createHmac('sha256', secret)
    .update(`${weekKey}:${userId}`)
    .digest('hex')
}

export async function getWeeklyManitto(userId: string): Promise<WeeklyManitto> {
  const week = getSeoulWeek()

  const [{ data: allowedMembers }, { data: profiles }] = await Promise.all([
    supabaseAdmin
      .from('allowed_users')
      .select('email')
      .eq('status', 'active')
      .not('agreed_at', 'is', null)
      .returns<AllowedMember[]>(),
    supabaseAdmin
      .from('user_profiles')
      .select('user_id, email, nickname, completed_at')
      .not('completed_at', 'is', null)
      .returns<EligibleProfile[]>(),
  ])

  const allowedEmails = new Set(
    (allowedMembers ?? []).map((member) => member.email.trim().toLowerCase())
  )
  const eligibleProfiles = (profiles ?? [])
    .filter((profile) => allowedEmails.has(profile.email.trim().toLowerCase()))
    .sort((a, b) =>
      getShuffleScore(week.weekKey, a.user_id).localeCompare(
        getShuffleScore(week.weekKey, b.user_id)
      )
    )

  const participantIndex = eligibleProfiles.findIndex(
    (profile) => profile.user_id === userId
  )
  const hasMatch = eligibleProfiles.length >= 2 && participantIndex >= 0
  const recipient = hasMatch
    ? eligibleProfiles[(participantIndex + 1) % eligibleProfiles.length]
    : null

  return {
    ...week,
    participantCount: eligibleProfiles.length,
    recipientNickname: recipient?.nickname ?? null,
  }
}
