import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const webSplash = readFileSync(
  new URL('../src/app/components/AppLaunchSplash.tsx', import.meta.url),
  'utf8',
)
const webStyles = readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8',
)
const mobileLayout = readFileSync(
  new URL('../mobile/src/app/_layout.tsx', import.meta.url),
  'utf8',
)

describe('launch splash transitions', () => {
  it('holds the logo before a gradual web fade', () => {
    expect(webSplash).toContain('const SPLASH_HOLD_MS = 720')
    expect(webSplash).toContain('const SPLASH_EXIT_MS = 520')
    expect(webStyles).toContain('opacity 520ms cubic-bezier(0.22, 1, 0.36, 1)')
    expect(webStyles).toContain('animation: ub-launch-logo-in 480ms')
  })

  it('honors reduced-motion preferences', () => {
    expect(webSplash).toContain("window.matchMedia?.('(prefers-reduced-motion: reduce)')")
    expect(webStyles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('fades the native splash instead of cutting directly to the app', () => {
    expect(mobileLayout).toContain('SplashScreen.setOptions({')
    expect(mobileLayout).toContain('duration: 650')
    expect(mobileLayout).toContain('fade: true')
  })
})
