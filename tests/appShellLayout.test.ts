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
const manifest = readFileSync(
  new URL('../src/app/manifest.ts', import.meta.url),
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

  it('keeps the iOS bottom safe area and tab bar on one continuous surface', () => {
    expect(rootLayout).toContain('statusBarStyle: "black-translucent"')
    expect(rootLayout).toContain(
      '{ media: "(prefers-color-scheme: light)", color: "#e45330" }',
    )
    expect(rootLayout).toContain(
      '{ media: "(prefers-color-scheme: dark)", color: "#100d0c" }',
    )
    expect(manifest).toContain("theme_color: '#e45330'")
    expect(globalStyles).toContain('--ub-system-background: #f1ece9;')
    expect(globalStyles).toContain('--ub-system-background: #100d0c;')
    expect(globalStyles).toContain('--ub-bottom-surface: #f4f0ed;')
    expect(globalStyles).toContain('--ub-bottom-surface: #1c1c1e;')
    expect(globalStyles).toContain(
      '--ub-tabbar-background: var(--ub-bottom-surface);',
    )
    expect(globalStyles).toMatch(
      /html:has\(\.ub-app-frame\),[\s\S]*?body:has\(\.ub-app-frame\)[\s\S]*?background: var\(--ub-bottom-surface\);/,
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-frame\s*\{[\s\S]*?background: var\(--ub-bottom-surface\);/,
    )
  })

  it('keeps a compact glass navigation bar in installed PWA mode', () => {
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-frame\s*\{[\s\S]*?inset: 0;[\s\S]*?grid-template-rows: minmax\(0, 1fr\);/,
    )
    const standaloneFrameRule = globalStyles.match(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-frame\s*\{([\s\S]*?)\}/,
    )?.[1]
    expect(standaloneFrameRule).not.toContain('height: 100dvh;')
    expect(standaloneFrameRule).not.toContain('inset: 0 0 auto;')
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar\s*\{[\s\S]*?position: absolute;[\s\S]*?bottom: 0;[\s\S]*?height: 50px;[\s\S]*?background-color: var\(--ub-tabbar-background\);/,
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-scroll\s*\{[\s\S]*?padding-bottom: 0 !important;[\s\S]*?scroll-padding-bottom: 50px;/,
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-scroll > section\s*\{[\s\S]*?min-height: 100%;[\s\S]*?padding-bottom: 50px;/,
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar::before\s*\{[\s\S]*?content: none;/,
    )
    expect(globalStyles).toContain('backdrop-filter: blur(22px) saturate(155%);')
    expect(globalStyles).toContain('border-top: 0.5px solid var(--ub-separator);')
    expect(globalStyles).toContain('filter: none;')
    expect(globalStyles).toContain(
      'height: calc(50px - var(--ub-pwa-bottom-inset));',
    )
    expect(globalStyles).not.toContain('transform: translate3d(0, 8px, 0);')
    expect(globalStyles).toContain(
      'max(12px, calc(var(--ub-pwa-bottom-inset) + 2px))',
    )
    expect(globalStyles).toMatch(
      /@media \(display-mode: standalone\) \{[\s\S]*?\.ub-app-tabbar-label\s*\{[\s\S]*?margin-top: 0;/,
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
      /html:has\(\.ub-launch-splash:not\(\.ub-launch-splash-leaving\)\),[\s\S]*?body:has\(\.ub-launch-splash:not\(\.ub-launch-splash-leaving\)\)[\s\S]*?background: var\(--ub-color-brand\);/,
    )
    expect(globalStyles).not.toContain('html:has(.ub-launch-splash),')
    expect(globalStyles).toMatch(
      /html:has\(\.ub-app-frame\),[\s\S]*?body:has\(\.ub-app-frame\)[\s\S]*?background: var\(--ub-bottom-surface\);/,
    )
  })
})
