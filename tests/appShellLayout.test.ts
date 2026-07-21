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
const rootLayout = readFileSync(
  new URL('../src/app/layout.tsx', import.meta.url),
  'utf8',
)
const launchSplash = readFileSync(
  new URL('../src/app/components/AppLaunchSplash.tsx', import.meta.url),
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
    expect(frameRule).toContain('z-index: 0;')
    expect(frameRule).toContain('background: var(--ub-app-background);')
    expect(frameRule).not.toContain('standalone-bottom-compensation')
  })

  it('keeps only floating navigation icons in installed PWA mode', () => {
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-frame\s*\{[\s\S]*?inset: 0;[\s\S]*?grid-template-rows: minmax\(0, 1fr\);/,
    )
    const standaloneFrameRule = globalStyles.match(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-frame\s*\{([\s\S]*?)\}/,
    )?.[1]
    expect(standaloneFrameRule).not.toContain('height: 100dvh;')
    expect(standaloneFrameRule).not.toContain('inset: 0 0 auto;')
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar\s*\{[\s\S]*?position: absolute;[\s\S]*?bottom: 0;[\s\S]*?height: 50px;[\s\S]*?background-color: transparent;/,
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar::before\s*\{[\s\S]*?content: none;/,
    )
    expect(globalStyles).toContain('backdrop-filter: none;')
    expect(globalStyles).toContain('filter: drop-shadow(')
    expect(globalStyles).toContain(
      'height: calc(50px - var(--ub-pwa-bottom-inset));',
    )
    expect(globalStyles).not.toContain('transform: translate3d(0, 8px, 0);')
    expect(globalStyles).toContain(
      'transform: translateY(max(9px, var(--ub-pwa-bottom-inset)));',
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar-link\s*\{[\s\S]*?height: 100%;[\s\S]*?min-height: 0;/,
    )
    expect(appShell).toContain('ub-app-tabbar-content grid')
    expect(appShell).toContain('ub-app-tabbar-link relative')
    expect(appShell).toContain('ub-app-tabbar-label max-w-full')
    expect(appShell).not.toContain('justify-center border-t')
    expect(routeLoading).not.toContain('ub-app-tabbar')
  })

  it('covers the complete standalone viewport above the app frame during launch', () => {
    const splashRule = globalStyles.match(
      /\.ub-launch-splash\s*\{([\s\S]*?)\}/,
    )?.[1]
    expect(splashRule).toContain('z-index: 1000 !important;')
    expect(splashRule).not.toContain('height: 100dvh;')
    expect(rootLayout).toContain('viewportFit: "cover"')
    expect(launchSplash).toContain('fixed inset-0')
    expect(appShell).toContain('ub-app-frame')
    expect(globalStyles).toMatch(
      /html:has\(\.ub-launch-splash\),[\s\S]*?body:has\(\.ub-launch-splash\)[\s\S]*?background: var\(--ub-color-brand\);/,
    )
    expect(globalStyles).toMatch(
      /html:has\(\.ub-app-frame\),[\s\S]*?body:has\(\.ub-app-frame\)[\s\S]*?background: var\(--ub-app-background\);/,
    )
  })
})
