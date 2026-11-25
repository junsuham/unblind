'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  bibleAvatarStorageKey,
  PIXEL_AVATAR_UPDATED_EVENT,
  readBibleAvatarPreset,
  suggestedBibleAvatar,
} from '@/lib/pixelAvatar'

const getServerSnapshot = () => undefined

export function useFaithAvatar(scope: string, nickname: string) {
  const subscribe = useCallback((sync: () => void) => {
    const onUpdate = (event: Event) => {
      if ((event as CustomEvent<string>).detail === scope) sync()
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === bibleAvatarStorageKey(scope)) sync()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    window.addEventListener(PIXEL_AVATAR_UPDATED_EVENT, onUpdate)
    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', sync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener(PIXEL_AVATAR_UPDATED_EVENT, onUpdate)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [scope])
  const getSnapshot = useCallback(() => readBibleAvatarPreset(scope), [scope])
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { ready: saved !== undefined, avatar: saved ?? suggestedBibleAvatar(nickname) }
}
