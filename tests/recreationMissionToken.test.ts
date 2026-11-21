import { describe, expect, it } from 'vitest'
import { issueMissionGuestToken, verifyMissionGuestToken } from '../src/lib/recreationMissionToken'

const roomId = '11111111-1111-4111-8111-111111111111'
const anotherRoomId = '22222222-2222-4222-8222-222222222222'
const participantId = '33333333-3333-4333-8333-333333333333'
const secret = 'test-only-secret'

describe('mission guest tokens', () => {
  it('recognizes only the participant and room for which a token was issued', () => {
    const token = issueMissionGuestToken(roomId, participantId, new Date(Date.now() + 60_000).toISOString(), secret)
    expect(token).toBeTruthy()
    expect(verifyMissionGuestToken(token!, roomId, secret)).toBe(participantId)
    expect(verifyMissionGuestToken(token!, anotherRoomId, secret)).toBeNull()
    expect(verifyMissionGuestToken(token!, roomId, 'other-secret')).toBeNull()
  })

  it('rejects altered, expired, and malformed tokens', () => {
    const token = issueMissionGuestToken(roomId, participantId, new Date(Date.now() + 60_000).toISOString(), secret)!
    expect(verifyMissionGuestToken(`${token}a`, roomId, secret)).toBeNull()
    expect(verifyMissionGuestToken('not-a-token', roomId, secret)).toBeNull()
    const expired = issueMissionGuestToken(roomId, participantId, new Date(Date.now() - 60_000).toISOString(), secret)!
    expect(verifyMissionGuestToken(expired, roomId, secret)).toBeNull()
  })
})
