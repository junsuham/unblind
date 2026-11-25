import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { avatarStorageKey, defaultPixelAvatar, isDefaultPixelAvatar, isPixelAvatarAppearance } from '../src/lib/pixelAvatar'

describe('faith check-in pixel avatar', () => {
  it('accepts only supported equipment layers and six-digit colors', () => {
    expect(isPixelAvatarAppearance(defaultPixelAvatar)).toBe(true)
    expect(isPixelAvatarAppearance({ ...defaultPixelAvatar, skin: '#fff' })).toBe(false)
    expect(isPixelAvatarAppearance({ ...defaultPixelAvatar, hat: 'crown' })).toBe(false)
  })

  it('separates the locally saved appearance by account', () => {
    expect(avatarStorageKey('member-a')).not.toBe(avatarStorageKey('member-b'))
  })

  it('uses the supplied pixel sprite by default and keeps custom colors separate', () => {
    expect(isDefaultPixelAvatar(defaultPixelAvatar)).toBe(true)
    expect(isDefaultPixelAvatar({ ...defaultPixelAvatar, top: '#123456' })).toBe(false)
    const avatar = readFileSync(new URL('../src/app/components/FaithAvatar.tsx', import.meta.url), 'utf8')
    const room = readFileSync(new URL('../src/app/pray/PrayerRoomScene.tsx', import.meta.url), 'utf8')
    const prayerBoard = readFileSync(new URL('../src/app/board/[board]/page.tsx', import.meta.url), 'utf8')
    expect(avatar).toContain('/avatars/faith-player-reference-v2.png')
    expect(room).toContain('/avatars/faith-player-reference-v2.png')
    expect(room).toContain('/prayer/prayer-room-reference-v2.png')
    expect(prayerBoard).toContain('/prayer/prayer-room-reference-v2.png')
  })
})
