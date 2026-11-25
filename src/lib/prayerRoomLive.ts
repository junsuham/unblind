import { findBibleAvatarPreset } from './pixelAvatar'

export type PrayerRoomPosition = {
  x: number
  y: number
  facing: 'left' | 'right'
  avatarId: string
  isPraying?: boolean
}

export type PrayerRoomPeer = PrayerRoomPosition & { id: string; nickname: string }
export type PrayerRoomMessage = { id: string; nickname: string; text: string; sentAt: string }
export type PrayerRoomSnapshot = { peers: PrayerRoomPeer[]; messages: PrayerRoomMessage[]; chatSent: boolean }

export const prayerRoomMessageLimit = 160
export const prayerRoomLiveVersion = 2
export const prayerRoomMaxY = 2240
export const prayerRoomBubbleDuration = 10_000

export function prayerRoomPoseSrc(avatarId: string) {
  return findBibleAvatarPreset(avatarId) ? `/avatars/bible-prayer-v1/${avatarId}.webp` : null
}

/** Both room RPC lists use the same unique, server-assigned profile nickname. */
export function latestPrayerRoomBubbles(messages: readonly PrayerRoomMessage[], now: number) {
  const bubbles = new Map<string, PrayerRoomMessage>()
  const stamps = new Map<string, number>()
  for (const message of messages) {
    const stamp = Date.parse(message.sentAt)
    if (!Number.isFinite(stamp) || stamp + prayerRoomBubbleDuration <= now || stamp > now + prayerRoomBubbleDuration) continue
    if ((stamps.get(message.nickname) ?? -Infinity) > stamp) continue
    stamps.set(message.nickname, stamp)
    bubbles.set(message.nickname, message)
  }
  return bubbles
}

export function parsePrayerRoomPosition(value: unknown, roomVersion: 1 | 2 = prayerRoomLiveVersion): PrayerRoomPosition | null {
  if (!value || typeof value !== 'object') return null
  const { x, y, facing, avatarId, isPraying } = value as Record<string, unknown>
  const maxY = roomVersion === 1 ? 1120 : prayerRoomMaxY
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 360
    || typeof y !== 'number' || !Number.isFinite(y) || y < 0 || y > maxY
    || (facing !== 'left' && facing !== 'right')
    || typeof avatarId !== 'string' || !findBibleAvatarPreset(avatarId)
    || (isPraying !== undefined && typeof isPraying !== 'boolean')) return null
  return { x: Math.round(x), y: Math.round(y), facing, avatarId, ...(typeof isPraying === 'boolean' ? { isPraying } : {}) }
}

export function parsePrayerRoomVisitId(value: unknown): string | null {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null
}

export function parsePrayerRoomMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.normalize('NFC').trim().replace(/\s+/gu, ' ')
  if (!text || [...text].length > prayerRoomMessageLimit
    || /[\p{Cc}\p{Cf}]/u.test(text)) return null
  // The room is for encouragement, not link sharing or sharing contact details.
  if (/\b(?:https?:\/\/|www\.)|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:01[016789][ .-]?\d{3,4}[ .-]?\d{4})/iu.test(text)) return null
  return text
}
