import { createHmac, timingSafeEqual } from 'node:crypto'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function issueMissionGuestToken(roomId: string, participantId: string, expiresAt: string, secret = process.env.SUPABASE_SECRET_KEY) {
  const expiry = Date.parse(expiresAt)
  if (!secret || !uuidPattern.test(roomId) || !uuidPattern.test(participantId) || !Number.isFinite(expiry)) return null
  const payload = Buffer.from(`${roomId}:${participantId}:${Math.floor(expiry / 1000)}`).toString('base64url')
  const signature = createHmac('sha256', secret).update(`mission-guest-v1:${payload}`).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyMissionGuestToken(token: string, roomId: string, secret = process.env.SUPABASE_SECRET_KEY) {
  if (!secret || token.length > 512 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null
  const [payload, signature] = token.split('.')
  const actual = Buffer.from(signature, 'base64url')
  const expected = createHmac('sha256', secret).update(`mission-guest-v1:${payload}`).digest()
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
  const [signedRoomId, participantId, expiry] = Buffer.from(payload, 'base64url').toString('utf8').split(':')
  if (signedRoomId !== roomId || !uuidPattern.test(participantId) || !/^\d+$/.test(expiry) || Number(expiry) * 1000 <= Date.now()) return null
  return participantId
}
