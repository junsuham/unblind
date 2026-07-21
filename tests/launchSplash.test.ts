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
const nativeTransition = readFileSync(
  new URL('../mobile/src/components/NativeLaunchTransition.tsx', import.meta.url),
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

  it('covers the complete native root while the app becomes ready', () => {
    expect(mobileLayout).not.toContain('SplashScreen.setOptions')
    expect(mobileLayout).toContain('backgroundColor: colors.brand')
    expect(mobileLayout).toContain('<NativeLaunchTransition />')
    expect(nativeTransition).toContain('...StyleSheet.absoluteFillObject')
    expect(nativeTransition).toContain('backgroundColor: colors.brand')
    expect(nativeTransition).toContain('zIndex: 9999')
    expect(nativeTransition).toContain('profileComplete !== null && accountReady')
  })

  it('hides the native logo before revealing the navigation surface', () => {
    expect(nativeTransition).toContain('duration: 260')
    expect(nativeTransition).toContain('duration: 420')
    expect(nativeTransition).toContain('toValue: 0')
  })
})
