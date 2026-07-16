export type PushPreferenceKey =
  | 'comments_enabled'
  | 'reactions_enabled'
  | 'manitto_enabled'
  | 'system_enabled'

export type PushPreferences = Record<PushPreferenceKey, boolean> & {
  push_enabled: boolean
  quiet_start: string | null
  quiet_end: string | null
}

export function preferenceKeyForNotification(type: string): PushPreferenceKey {
  if (type === 'comment') return 'comments_enabled'
  if (type === 'reaction') return 'reactions_enabled'
  if (type === 'manitto') return 'manitto_enabled'
  return 'system_enabled'
}

export function timeToMinutes(value: string | null) {
  if (!value) return null
  const [hour, minute] = value.slice(0, 5).split(':').map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  return hour * 60 + minute
}

export function isMinuteWithinQuietHours(
  currentMinute: number,
  quietStart: string | null,
  quietEnd: string | null
) {
  const start = timeToMinutes(quietStart)
  const end = timeToMinutes(quietEnd)

  if (start === null || end === null || start === end) return false
  return start < end
    ? currentMinute >= start && currentMinute < end
    : currentMinute >= start || currentMinute < end
}

export function getSeoulMinute(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) % 24
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

export function shouldDeliverPush(
  type: string,
  preferences: PushPreferences,
  currentMinute = getSeoulMinute()
) {
  if (!preferences.push_enabled) return false
  if (!preferences[preferenceKeyForNotification(type)]) return false
  return !isMinuteWithinQuietHours(
    currentMinute,
    preferences.quiet_start,
    preferences.quiet_end
  )
}
