import { type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminRequest } from '@/lib/adminAuth'
import {
  isMinuteWithinQuietHours,
  getSeoulMinute,
  preferenceKeyForNotification,
  type PushPreferences,
} from '@/lib/push'

export const runtime = 'nodejs'

type PendingNotification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  href: string | null
  push_attempts: number
}

type PushToken = { token: string; user_id: string }
type PreferenceRow = PushPreferences & { user_id: string }

const defaultPreferences: PushPreferences = {
  push_enabled: false,
  comments_enabled: true,
  reactions_enabled: true,
  manitto_enabled: true,
  system_enabled: true,
  quiet_start: null,
  quiet_end: null,
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

async function dispatchPendingNotifications() {
  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, title, body, href, push_attempts')
    .is('push_sent_at', null)
    .lt('push_attempts', 5)
    .order('created_at', { ascending: true })
    .limit(100)
    .returns<PendingNotification[]>()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!notifications?.length) return Response.json({ ok: true, sent: 0 })

  const userIds = [...new Set(notifications.map((item) => item.user_id))]
  const [{ data: tokens }, { data: preferences }] = await Promise.all([
    supabaseAdmin
      .from('push_tokens')
      .select('token, user_id')
      .in('user_id', userIds)
      .eq('is_active', true)
      .returns<PushToken[]>(),
    supabaseAdmin
      .from('notification_preferences')
      .select('user_id, push_enabled, comments_enabled, reactions_enabled, manitto_enabled, system_enabled, quiet_start, quiet_end')
      .in('user_id', userIds)
      .returns<PreferenceRow[]>(),
  ])

  const preferencesByUser = new Map((preferences ?? []).map((item) => [item.user_id, item]))
  const tokensByUser = new Map<string, string[]>()
  for (const item of tokens ?? []) {
    tokensByUser.set(item.user_id, [...(tokensByUser.get(item.user_id) ?? []), item.token])
  }

  const now = new Date().toISOString()
  const currentMinute = getSeoulMinute()
  const messages: { to: string; sound: 'default'; title: string; body?: string; data: { href?: string; notificationId: string }; notificationId: string }[] = []
  const completedWithoutDelivery: string[] = []

  for (const notification of notifications) {
    const prefs = preferencesByUser.get(notification.user_id) ?? defaultPreferences
    const preferenceEnabled = prefs.push_enabled && prefs[preferenceKeyForNotification(notification.type)]
    const isQuiet = isMinuteWithinQuietHours(currentMinute, prefs.quiet_start, prefs.quiet_end)
    const userTokens = tokensByUser.get(notification.user_id) ?? []

    if (!preferenceEnabled || userTokens.length === 0) {
      completedWithoutDelivery.push(notification.id)
      continue
    }

    if (isQuiet) continue

    for (const token of userTokens) {
      messages.push({
        to: token,
        sound: 'default',
        title: notification.title,
        ...(notification.body ? { body: notification.body } : {}),
        data: {
          ...(notification.href ? { href: notification.href } : {}),
          notificationId: notification.id,
        },
        notificationId: notification.id,
      })
    }
  }

  if (completedWithoutDelivery.length) {
    await supabaseAdmin
      .from('notifications')
      .update({ push_sent_at: now, push_last_error: null })
      .in('id', completedWithoutDelivery)
  }

  if (!messages.length) {
    return Response.json({ ok: true, sent: 0, deferred: notifications.length - completedWithoutDelivery.length })
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages.map((message) => ({
      to: message.to,
      sound: message.sound,
      title: message.title,
      ...(message.body ? { body: message.body } : {}),
      data: message.data,
    }))),
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const attemptedIds = [...new Set(messages.map((message) => message.notificationId))]
    for (const id of attemptedIds) {
      const item = notifications.find((notification) => notification.id === id)
      await supabaseAdmin
        .from('notifications')
        .update({
          push_attempts: (item?.push_attempts ?? 0) + 1,
          push_last_error: `expo_http_${response.status}`,
        })
        .eq('id', id)
    }
    return Response.json({ error: '푸시 발송 서비스가 응답하지 않았습니다.' }, { status: 502 })
  }

  const tickets = Array.isArray(result?.data) ? result.data : []
  const succeeded = new Set<string>()
  const failed = new Map<string, string>()

  messages.forEach((message, index) => {
    const ticket = tickets[index]
    if (ticket?.status === 'ok') succeeded.add(message.notificationId)
    else failed.set(message.notificationId, ticket?.message ?? 'expo_ticket_error')
  })

  if (succeeded.size) {
    await supabaseAdmin
      .from('notifications')
      .update({ push_sent_at: now, push_last_error: null })
      .in('id', [...succeeded])
  }

  for (const [id, message] of failed) {
    const current = notifications.find((notification) => notification.id === id)
    await supabaseAdmin
      .from('notifications')
      .update({ push_attempts: (current?.push_attempts ?? 0) + 1, push_last_error: message.slice(0, 500) })
      .eq('id', id)
  }

  return Response.json({ ok: true, sent: succeeded.size, failed: failed.size })
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 401 })
  }
  return dispatchPendingNotifications()
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return dispatchPendingNotifications()
}
