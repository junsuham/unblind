'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const SPLASH_SESSION_KEY = 'unblind-launch-splash-seen'

export function AppLaunchSplash() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let splashSeen = false
    try {
      splashSeen = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1'
    } catch {
      // Safari privacy settings can block storage. The splash must still finish.
    }

    if (splashSeen) {
      const hideTimer = window.setTimeout(() => setVisible(false), 0)
      return () => window.clearTimeout(hideTimer)
    }

    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1')
    } catch {
      // Continue with the timed splash when storage is unavailable.
    }
    const fadeTimer = window.setTimeout(() => setLeaving(true), 180)
    const removeTimer = window.setTimeout(() => {
      setVisible(false)
    }, 420)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`ub-launch-splash fixed inset-0 z-[300] flex items-center justify-center bg-[#fc5230] px-8 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] ${leaving ? 'ub-launch-splash-leaving' : ''}`} aria-label="언블라인드 시작 화면">
      <Image src="/brand/unblind-mark-glass-v2.png" alt="UNBLIND" width={164} height={164} preload unoptimized className="ub-brand-logo ub-launch-splash-logo h-[164px] w-[164px] object-contain" />
    </div>
  )
}
