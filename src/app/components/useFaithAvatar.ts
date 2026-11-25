'use client'

import { useEffect, useState } from 'react'
import { PIXEL_AVATAR_UPDATED_EVENT, readGeneratedAvatar, type GeneratedPixelAvatar } from '@/lib/pixelAvatar'

export function useFaithAvatar(scope: string) {
  const [record, setRecord] = useState<{ scope: string; avatar: GeneratedPixelAvatar | null } | null>(null)

  useEffect(() => {
    let active = true
    let readVersion = 0
    function sync() {
      const version = ++readVersion
      void readGeneratedAvatar(scope).catch(() => null).then((avatar) => {
        if (active && version === readVersion) setRecord({ scope, avatar })
      })
    }
    function onUpdate(event: Event) {
      if ((event as CustomEvent<string>).detail === scope) sync()
    }
    function onVisible() {
      if (document.visibilityState === 'visible') sync()
    }
    window.addEventListener(PIXEL_AVATAR_UPDATED_EVENT, onUpdate)
    window.addEventListener('pageshow', sync)
    document.addEventListener('visibilitychange', onVisible)
    sync()
    return () => {
      active = false
      window.removeEventListener(PIXEL_AVATAR_UPDATED_EVENT, onUpdate)
      window.removeEventListener('pageshow', sync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [scope])

  const ready = record?.scope === scope
  return { ready, avatar: ready ? record.avatar : null }
}
