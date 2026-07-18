import { randomUUID } from 'node:crypto'
import { type NextRequest } from 'next/server'
import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSafeNotificationHref } from '@/lib/notificationHref'
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
type WebPushSubscription = { endpoint: string; p256dh: string; auth: string; user_id: string }
type PreferenceRow = PushPreferences & { user_id: string }
type WebPushJob = { notificationId: string; subscription: WebPushSubscription; payload: string }

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

let webPushConfigured = false

function configureWebPush() {
  if (webPushConfigured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return false

  webpush.setVapidDetails(subject, publicKey, privateKey)
  webPushConfigured = true
  return true
}

async function dispatchPendingNotifications() {
  const claimId = randomUUID()
  const { data, error } = await supabaseAdmin
    .rpc('claim_pending_notifications', { p_claim_id: claimId, p_limit: 100 })
  const notifications = data as unknown as PendingNotification[] | null

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!notifications?.length) return Response.json({ ok: true, sent: 0 })

  const userIds = [...new Set(notifications.map((item) => item.user_id))]
  const [tokensResult, webSubscriptionsResult, preferencesResult] = await Promise.all([
    supabaseAdmin
      .from('push_tokens')
      .select('token, user_id')
      .in('user_id', userIds)
      .eq('is_active', true)
      .returns<PushToken[]>(),
    supabaseAdmin
      .from('web_push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', userIds)
      .eq('is_active', true)
      .returns<WebPushSubscription[]>(),
    supabaseAdmin
      .from('notification_preferences')
      .select('user_id, push_enabled, comments_enabled, reactions_enabled, manitto_enabled, system_enabled, quiet_start, quiet_end')
      .in('user_id', userIds)
      .returns<PreferenceRow[]>(),
  ])
  const tokens = tokensResult.data
  const webSubscriptions = webSubscriptionsResult.data
  const preferences = preferencesResult.data

  if (tokensResult.error || webSubscriptionsResult.error || preferencesResult.error) {
    await supabaseAdmin
      .from('notifications')
      .update({ push_claim_id: null, push_claimed_at: null })
      .eq('push_claim_id', claimId)
    return Response.json({ error: '푸시 설정을 불러오지 못했습니다.' }, { status: 500 })
  }

  const preferencesByUser = new Map((preferences ?? []).map((item) => [item.user_id, item]))
  const tokensByUser = new Map<string, string[]>()
  for (const item of tokens ?? []) {
    tokensByUser.set(item.user_id, [...(tokensByUser.get(item.user_id) ?? []), item.token])
  }
  const webSubscriptionsByUser = new Map<string, WebPushSubscription[]>()
  for (const item of webSubscriptions ?? []) {
    webSubscriptionsByUser.set(item.user_id, [...(webSubscriptionsByUser.get(item.user_id) ?? []), item])
  }

  const now = new Date().toISOString()
  const currentMinute = getSeoulMinute()
  const messages: { to: string; sound: 'default'; title: string; body?: string; data: { href?: string; notificationId: string }; notificationId: string }[] = []
  const webJobs: WebPushJob[] = []
  const completedWithoutDelivery: string[] = []
  const deferred: string[] = []
  const canSendWebPush = configureWebPush()

  for (const notification of notifications) {
    const prefs = preferencesByUser.get(notification.user_id) ?? defaultPreferences
    const preferenceEnabled = prefs.push_enabled && prefs[preferenceKeyForNotification(notification.type)]
    const isQuiet = isMinuteWithinQuietHours(currentMinute, prefs.quiet_start, prefs.quiet_end)
    const userTokens = tokensByUser.get(notification.user_id) ?? []
    const userWebSubscriptions = canSendWebPush ? (webSubscriptionsByUser.get(notification.user_id) ?? []) : []

    if (!preferenceEnabled || (userTokens.length === 0 && userWebSubscriptions.length === 0)) {
      completedWithoutDelivery.push(notification.id)
      continue
    }

    if (isQuiet) {
      deferred.push(notification.id)
      continue
    }

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

    const href = getSafeNotificationHref(notification.href, null) ?? '/notifications'
    for (const subscription of userWebSubscriptions) {
      webJobs.push({
        notificationId: notification.id,
        subscription,
        payload: JSON.stringify({
          title: notification.title,
          body: notification.body ?? '',
          href,
          notificationId: notification.id,
        }),
      })
    }
  }

  if (completedWithoutDelivery.length) {
    await supabaseAdmin
      .from('notifications')
      .update({ push_sent_at: now, push_last_error: null, push_claim_id: null, push_claimed_at: null })
      .in('id', completedWithoutDelivery)
      .eq('push_claim_id', claimId)
  }

  if (deferred.length) {
    await supabaseAdmin
      .from('notifications')
      .update({ push_claim_id: null, push_claimed_at: null })
      .in('id', deferred)
      .eq('push_claim_id', claimId)
  }

  if (!messages.length && !webJobs.length) {
    return Response.json({ ok: true, sent: 0, deferred: notifications.length - completedWithoutDelivery.length })
  }

  const succeeded = new Set<string>()
  const failureReasons = new Map<string, string[]>()
  const recordFailure = (id: string, reason: string) => {
    failureReasons.set(id, [...(failureReasons.get(id) ?? []), reason.slice(0, 160)])
  }

  if (messages.length) {
    try {
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
        for (const message of messages) recordFailure(message.notificationId, `expo_http_${response.status}`)
      } else {
        const tickets = Array.isArray(result?.data) ? result.data : []
        messages.forEach((message, index) => {
          const ticket = tickets[index]
          if (ticket?.status === 'ok') succeeded.add(message.notificationId)
          else recordFailure(message.notificationId, ticket?.message ?? 'expo_ticket_error')
        })
      }
    } catch {
      for (const message of messages) recordFailure(message.notificationId, 'expo_network_error')
    }
  }

  await Promise.all(webJobs.map(async (job) => {
    try {
      await webpush.sendNotification(
        { endpoint: job.subscription.endpoint, keys: { p256dh: job.subscription.p256dh, auth: job.subscription.auth } },
        job.payload,
        { TTL: 60 * 60, urgency: 'normal' },
      )
      succeeded.add(job.notificationId)
    } catch (error) {
      const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0
      if (statusCode === 404 || statusCode === 410) {
        await supabaseAdmin
          .from('web_push_subscriptions')
          .update({ is_active: false, updated_at: now })
          .eq('endpoint', job.subscription.endpoint)
      }
      recordFailure(job.notificationId, statusCode ? `web_push_http_${statusCode}` : 'web_push_error')
    }
  }))

  const attemptedIds = new Set([
    ...messages.map((message) => message.notificationId),
    ...webJobs.map((job) => job.notificationId),
  ])
  const failed = new Map(
    [...attemptedIds]
      .filter((id) => !succeeded.has(id))
      .map((id) => [id, (failureReasons.get(id) ?? ['push_delivery_failed']).join(',')]),
  )

  if (succeeded.size) {
    await supabaseAdmin
      .from('notifications')
      .update({ push_sent_at: now, push_last_error: null, push_claim_id: null, push_claimed_at: null })
      .in('id', [...succeeded])
      .eq('push_claim_id', claimId)
  }

  for (const [id, message] of failed) {
    const current = notifications.find((notification) => notification.id === id)
    await supabaseAdmin
      .from('notifications')
      .update({
        push_attempts: (current?.push_attempts ?? 0) + 1,
        push_last_error: message.slice(0, 500),
        push_claim_id: null,
        push_claimed_at: null,
      })
      .eq('id', id)
      .eq('push_claim_id', claimId)
  }

  return Response.json({ ok: true, sent: succeeded.size, failed: failed.size })
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 401 })
  }
  const response = await dispatchPendingNotifications()
  const { error } = await supabaseAdmin.rpc('prune_operational_data')
  if (error) console.error('operational_prune_failed', error.message)
  return response
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  return dispatchPendingNotifications()
}
