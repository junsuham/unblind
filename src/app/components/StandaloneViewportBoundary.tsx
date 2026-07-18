'use client'

import { useLayoutEffect } from 'react'
import { getStandaloneBottomCompensation } from '@/lib/standaloneViewport'

const COMPENSATION_PROPERTY = '--ub-standalone-bottom-compensation'

function readSafeAreaBottom() {
  const probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = [
    'position:fixed',
    'left:0',
    'bottom:0',
    'width:0',
    'height:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-bottom:env(safe-area-inset-bottom, 0px)',
  ].join(';')
  document.body.appendChild(probe)
  const safeAreaBottom = Number.parseFloat(
    window.getComputedStyle(probe).paddingBottom,
  )
  probe.remove()
  return Number.isFinite(safeAreaBottom) ? safeAreaBottom : 0
}

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  )
}

export function StandaloneViewportBoundary() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const standalone = isStandaloneMode()

    if (!standalone) {
      root.style.setProperty(COMPENSATION_PROPERTY, '0px')
      return
    }

    const safeAreaBottom = readSafeAreaBottom()

    const syncViewport = () => {
      const compensation = getStandaloneBottomCompensation({
        isStandalone: true,
        safeAreaBottom,
        screenHeight: window.screen.height,
        viewportHeight: window.innerHeight,
      })

      root.style.setProperty(COMPENSATION_PROPERTY, `${compensation}px`)
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    window.addEventListener('orientationchange', syncViewport)

    return () => {
      window.removeEventListener('resize', syncViewport)
      window.removeEventListener('orientationchange', syncViewport)
    }
  }, [])

  return null
}
