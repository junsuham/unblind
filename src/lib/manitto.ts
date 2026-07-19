import 'server-only'

import { createHmac } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { decodeManittoCard, type ManittoCardKind } from '@/lib/manittoCards'

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
  joined: boolean
  isActive: boolean
  revealEnabled: boolean
  receivedMessages: {
    id: string
    body: string
    kind: ManittoCardKind
    verse: { reference: string; text: string } | null
    createdAt: string
  }[]
}

export type ManittoAssignment = WeeklyManitto & {
  recipientUserId: string | null
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

export async function getManittoAssignment(userId: string): Promise<ManittoAssignment> {
  const week = getSeoulWeek()

  const [{ data: allowedMembers }, { data: profiles }, { data: participants }, { data: settings }] = await Promise.all([
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
    supabaseAdmin.from('manitto_participants').select('user_id').eq('is_active', true).returns<{ user_id: string }[]>(),
    supabaseAdmin.from('manitto_settings').select('is_active, starts_on, ends_on, reveal_enabled').eq('id', 1).maybeSingle<{ is_active: boolean; starts_on: string | null; ends_on: string | null; reveal_enabled: boolean }>(),
  ])

  const allowedEmails = new Set(
    (allowedMembers ?? []).map((member) => member.email.trim().toLowerCase())
  )
  const participantIds = new Set((participants ?? []).map((item) => item.user_id))
  const eligibleProfiles = (profiles ?? [])
    .filter((profile) => allowedEmails.has(profile.email.trim().toLowerCase()) && participantIds.has(profile.user_id))
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

  const today = new Date().toISOString().slice(0, 10)
  const isActive = Boolean(settings?.is_active) && (!settings?.starts_on || settings.starts_on <= today) && (!settings?.ends_on || settings.ends_on >= today)
  const { data: receivedMessages } = await supabaseAdmin
    .from('manitto_messages')
    .select('id, body, created_at')
    .eq('recipient_id', userId)
    .eq('week_key', week.weekKey)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    ...week,
    participantCount: eligibleProfiles.length,
    recipientNickname: isActive ? recipient?.nickname ?? null : null,
    recipientUserId: isActive ? recipient?.user_id ?? null : null,
    joined: participantIds.has(userId),
    isActive,
    revealEnabled: Boolean(settings?.reveal_enabled),
    receivedMessages: (receivedMessages ?? []).map((item) => {
      const card = decodeManittoCard(item.body)
      return {
        id: item.id,
        body: card.message,
        kind: card.kind,
        verse: card.verse
          ? { reference: card.verse.reference, text: card.verse.text }
          : null,
        createdAt: item.created_at,
      }
    }),
  }
}

export async function getWeeklyManitto(userId: string): Promise<WeeklyManitto> {
  const assignment = await getManittoAssignment(userId)
  return {
    weekKey: assignment.weekKey,
    startsOn: assignment.startsOn,
    endsOn: assignment.endsOn,
    participantCount: assignment.participantCount,
    recipientNickname: assignment.recipientNickname,
    joined: assignment.joined,
    isActive: assignment.isActive,
    revealEnabled: assignment.revealEnabled,
    receivedMessages: assignment.receivedMessages,
  }
}
