'use client'

import { useEffect, useRef, useState } from 'react'

type ConnectionState = 'online' | 'offline' | 'restored'

export function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>('online')
  const restoredTimer = useRef<number | null>(null)

  useEffect(() => {
    const setOffline = () => {
      if (restoredTimer.current !== null) window.clearTimeout(restoredTimer.current)
      setState('offline')
    }
    const setOnline = () => {
      setState((current) => current === 'offline' ? 'restored' : 'online')
      if (restoredTimer.current !== null) window.clearTimeout(restoredTimer.current)
      restoredTimer.current = window.setTimeout(() => setState('online'), 2200)
    }

    if (!navigator.onLine) setOffline()
    window.addEventListener('offline', setOffline)
    window.addEventListener('online', setOnline)

    return () => {
      window.removeEventListener('offline', setOffline)
      window.removeEventListener('online', setOnline)
      if (restoredTimer.current !== null) window.clearTimeout(restoredTimer.current)
    }
  }, [])

  if (state === 'online') return null

  return (
    <div
      className={`fixed inset-x-4 top-[calc(env(safe-area-inset-top)+8px)] z-[1200] mx-auto max-w-[398px] rounded-full px-4 py-2 text-center text-[12px] font-semibold shadow-lg backdrop-blur-xl ${state === 'offline' ? 'bg-[#2c2c2e]/94 text-white' : 'bg-[#34c759]/94 text-white'}`}
      role="status"
      aria-live="polite"
    >
      {state === 'offline' ? '인터넷 연결이 끊겼습니다. 작성 내용은 이 기기에 보관됩니다.' : '인터넷 연결이 복구되었습니다.'}
    </div>
  )
}
