import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BIBLE_AVATAR_SCENE_UPDATED_EVENT,
  bibleAvatarSceneStorageKey,
  bibleAvatarScenes,
  getBibleAvatarScene,
  readBibleAvatarSceneId,
  saveBibleAvatarSceneId,
  type BibleAvatarSceneId,
} from '../src/lib/bibleAvatarScenes'

afterEach(() => vi.unstubAllGlobals())

describe('Bible avatar scenes', () => {
  it('lists ten different scene image paths and verse references', () => {
    expect(bibleAvatarScenes).toHaveLength(10)
    expect(new Set(bibleAvatarScenes.map(({ src }) => src)).size).toBe(10)
    expect(bibleAvatarScenes.every(({ id, reference, src, thumbnailSrc }) =>
      reference.length > 0 &&
      src === `/avatars/bible-scenes-v1/${id}.webp` &&
      thumbnailSrc === `/avatars/bible-scenes-v1/thumbs/${id}.webp`,
    )).toBe(true)
  })

  it('defaults to Galilee before hydration and when a stored value is unknown', () => {
    expect(readBibleAvatarSceneId('member')).toBe('galilee')
    vi.stubGlobal('window', { localStorage: { getItem: () => '../not-a-scene' } })
    expect(readBibleAvatarSceneId('member')).toBe('galilee')
    expect(getBibleAvatarScene('galilee').name).toBe('갈릴리 호수')
  })

  it('persists one allowed scene per account and notifies the mounted studio', () => {
    const data = new Map<string, string>()
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => data.set(key, value),
      },
      dispatchEvent,
    })

    saveBibleAvatarSceneId('member', 'red-sea')
    expect(data.get(bibleAvatarSceneStorageKey('member'))).toBe('red-sea')
    expect(readBibleAvatarSceneId('member')).toBe('red-sea')
    expect(readBibleAvatarSceneId('other')).toBe('galilee')
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: BIBLE_AVATAR_SCENE_UPDATED_EVENT,
      detail: 'member',
    }))
    expect(() => saveBibleAvatarSceneId('member', 'unknown' as BibleAvatarSceneId)).toThrow()
    expect(readBibleAvatarSceneId('member')).toBe('red-sea')
  })
})
