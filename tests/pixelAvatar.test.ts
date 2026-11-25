import { describe, expect, it } from 'vitest'
import { avatarStorageKey, defaultPixelAvatar, isPixelAvatarAppearance } from '../src/lib/pixelAvatar'

describe('faith check-in pixel avatar', () => {
  it('accepts only supported equipment layers and six-digit colors', () => {
    expect(isPixelAvatarAppearance(defaultPixelAvatar)).toBe(true)
    expect(isPixelAvatarAppearance({ ...defaultPixelAvatar, skin: '#fff' })).toBe(false)
    expect(isPixelAvatarAppearance({ ...defaultPixelAvatar, hat: 'crown' })).toBe(false)
  })

  it('separates the locally saved appearance by account', () => {
    expect(avatarStorageKey('member-a')).not.toBe(avatarStorageKey('member-b'))
  })
})
