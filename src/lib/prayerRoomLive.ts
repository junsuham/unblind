import { findBibleAvatarPreset } from './pixelAvatar'

export type PrayerRoomPosition = {
  x: number
  y: number
  facing: 'left' | 'right'
  avatarId: string
}

export type PrayerRoomPeer = PrayerRoomPosition & { id: string; nickname: string }
export type PrayerRoomMessage = { id: string; nickname: string; text: string; sentAt: string }
export type PrayerRoomSnapshot = { peers: PrayerRoomPeer[]; messages: PrayerRoomMessage[]; chatSent: boolean }

export const prayerRoomMessageLimit = 160

export function parsePrayerRoomPosition(value: unknown): PrayerRoomPosition | null {
  if (!value || typeof value !== 'object') return null
  const { x, y, facing, avatarId } = value as Record<string, unknown>
  if (typeof x !== 'number' || !Number.isFinite(x) || x < 0 || x > 360
    || typeof y !== 'number' || !Number.isFinite(y) || y < 0 || y > 1120
    || (facing !== 'left' && facing !== 'right')
    || typeof avatarId !== 'string' || !findBibleAvatarPreset(avatarId)) return null
  return { x: Math.round(x), y: Math.round(y), facing, avatarId }
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
