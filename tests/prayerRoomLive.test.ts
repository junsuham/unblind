import { describe, expect, it } from 'vitest'
import { parsePrayerRoomMessage, parsePrayerRoomPosition } from '../src/lib/prayerRoomLive'

describe('prayer room exchange input', () => {
  const position = { x: 42.8, y: 1050.4, facing: 'left', avatarId: 'daniel' }
  it('uses safe rounded, in-bounds map coordinates and catalog sprites', () => {
    expect(parsePrayerRoomPosition(position)).toEqual({ ...position, x: 43, y: 1050 })
    for (const unsafe of [{ x: -1 }, { y: 1121 }, { y: Infinity }, { facing: 'forward' }, { avatarId: '/image.webp' }]) {
      expect(parsePrayerRoomPosition({ ...position, ...unsafe })).toBeNull()
    }
  })
  it('permits brief encouragement and rejects links, contact information and oversized input', () => {
    expect(parsePrayerRoomMessage(' 같이\n기도해요! 🙏 ')).toBe('같이 기도해요! 🙏')
    for (const unsafe of ['x'.repeat(161), 'https://example.com', 'example@local.test', '010-0000-0000', 'a\u0000b', ' ']) {
      expect(parsePrayerRoomMessage(unsafe)).toBeNull()
    }
  })
})
