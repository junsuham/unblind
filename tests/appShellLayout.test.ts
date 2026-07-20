import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const globalStyles = readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8',
)
const appShell = readFileSync(
  new URL('../src/app/components/ui/AppShell.tsx', import.meta.url),
  'utf8',
)
const routeLoading = readFileSync(
  new URL('../src/app/components/AppRouteLoading.tsx', import.meta.url),
  'utf8',
)

describe('app shell bottom tab bar', () => {
  it('counts the iOS bottom safe area exactly once', () => {
    const rule = globalStyles.match(/\.ub-app-tabbar\s*\{([\s\S]*?)\}/)?.[1]

    expect(rule).toBeDefined()
    expect(rule).toContain(
      'height: calc(55px + env(safe-area-inset-bottom, 0px));',
    )
    expect(rule).toContain('min-height: 0;')
    expect(rule).toContain(
      'padding-bottom: env(safe-area-inset-bottom, 0px);',
    )
    expect(rule).not.toMatch(/min-height:\s*calc\([^;]*safe-area-inset-bottom/)
  })

  it('anchors the fixed app frame to the visible viewport without guessed extension', () => {
    const frameRule = globalStyles.match(/\.ub-app-frame\s*\{([\s\S]*?)\}/)?.[1]

    expect(frameRule).toBeDefined()
    expect(frameRule).toContain('inset: 0;')
    expect(frameRule).not.toContain('standalone-bottom-compensation')
  })

  it('uses a compact viewport-bound tab bar only in installed PWA mode', () => {
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-frame\s*\{[\s\S]*?height: 100dvh;/,
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?--ub-pwa-bottom-inset: clamp\([\s\S]*?env\(safe-area-inset-bottom, 0px\)[\s\S]*?12px[\s\S]*?height: 50px;[\s\S]*?padding-bottom: var\(--ub-pwa-bottom-inset\);/,
    )
    expect(globalStyles).toContain(
      'height: calc(50px - var(--ub-pwa-bottom-inset));',
    )
    expect(globalStyles).toContain('transform: translate3d(0, 8px, 0);')
    expect(globalStyles).toContain('transform: translateY(8px);')
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar-link\s*\{[\s\S]*?height: 100%;[\s\S]*?min-height: 0;/,
    )
    expect(appShell).toContain('ub-app-tabbar-content grid')
    expect(appShell).toContain('ub-app-tabbar-link relative')
    expect(routeLoading).toContain('ub-app-tabbar-content mx-auto')
  })

  it('never lets a hidden launch splash keep the root safe area orange', () => {
    expect(globalStyles).not.toContain('html:has(.ub-launch-splash)')
    expect(globalStyles).not.toContain('body:has(.ub-launch-splash)')
  })
})
