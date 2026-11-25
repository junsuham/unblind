import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bibleAvatarPresets,
  bibleAvatarStorageKey,
  PIXEL_AVATAR_UPDATED_EVENT,
  readBibleAvatarPreset,
  resetBibleAvatarPreset,
  saveBibleAvatarPreset,
  suggestedBibleAvatar,
} from '../src/lib/pixelAvatar'

function stubBrowser() {
  const storage = new Map<string, string>()
  const events = new EventTarget()
  vi.stubGlobal('window', Object.assign(events, {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  }))
  return { storage, events }
}

afterEach(() => vi.unstubAllGlobals())

describe('Bible avatar preset selection', () => {
  it('has twenty distinct presets evenly split into both groups', () => {
    expect(bibleAvatarPresets).toHaveLength(20)
    expect(bibleAvatarPresets.filter(({ gender }) => gender === 'male')).toHaveLength(10)
    expect(bibleAvatarPresets.filter(({ gender }) => gender === 'female')).toHaveLength(10)
    expect(new Set(bibleAvatarPresets.map(({ id }) => id)).size).toBe(20)
    for (const { id, src } of bibleAvatarPresets) {
      expect(src).toBe(`/avatars/bible-v1/${id}.webp`)
    }
  })

  it('uses the nickname as a suggestion, with a stable fallback when no name matches', () => {
    expect(suggestedBibleAvatar('다니엘A').id).toBe('daniel')
    expect(suggestedBibleAvatar('에스더-SOAP').id).toBe('esther')
    expect(suggestedBibleAvatar('모세-TEST').id).toBe('moses')
    expect(bibleAvatarPresets).toContain(suggestedBibleAvatar('노아아님-TEST'))
    expect(suggestedBibleAvatar('노아아님-TEST')).toBe(suggestedBibleAvatar('노아아님-TEST'))
  })

  it('allows any preset regardless of nickname and keeps selections separate by account', () => {
    const { storage, events } = stubBrowser()
    const listener = vi.fn()
    events.addEventListener(PIXEL_AVATAR_UPDATED_EVENT, listener)
    expect(readBibleAvatarPreset('모세-TEST')).toBeNull()
    saveBibleAvatarPreset('모세-TEST', 'esther')
    expect(storage.get(bibleAvatarStorageKey('모세-TEST'))).toBe('esther')
    expect(readBibleAvatarPreset('모세-TEST')?.id).toBe('esther')
    expect(readBibleAvatarPreset('요한-TEST')).toBeNull()
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: '모세-TEST' }))
    resetBibleAvatarPreset('모세-TEST')
    expect(readBibleAvatarPreset('모세-TEST')).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('never loads a saved arbitrary ID or image URL', () => {
    const { storage } = stubBrowser()
    storage.set(bibleAvatarStorageKey('account-a'), 'https://example.invalid/photo.webp')
    expect(readBibleAvatarPreset('account-a')).toBeNull()
    expect(() => saveBibleAvatarPreset('account-a', 'unknown')).toThrow('목록에 있는 캐릭터')
  })
})
