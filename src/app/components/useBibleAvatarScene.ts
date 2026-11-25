'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  BIBLE_AVATAR_SCENE_UPDATED_EVENT,
  DEFAULT_BIBLE_AVATAR_SCENE,
  bibleAvatarSceneStorageKey,
  getBibleAvatarScene,
  readBibleAvatarSceneId,
  type BibleAvatarSceneId,
} from '@/lib/bibleAvatarScenes'

const getServerSnapshot = (): BibleAvatarSceneId => DEFAULT_BIBLE_AVATAR_SCENE

export function useBibleAvatarScene(scope: string) {
  const subscribe = useCallback((sync: () => void) => {
    const onUpdate = (event: Event) => {
      if ((event as CustomEvent<string>).detail === scope) sync()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === bibleAvatarSceneStorageKey(scope)) sync()
    }

    window.addEventListener(BIBLE_AVATAR_SCENE_UPDATED_EVENT, onUpdate)
    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', sync)
    return () => {
      window.removeEventListener(BIBLE_AVATAR_SCENE_UPDATED_EVENT, onUpdate)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', sync)
    }
  }, [scope])
  const getSnapshot = useCallback(() => readBibleAvatarSceneId(scope), [scope])
  const id = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return getBibleAvatarScene(id)
}
