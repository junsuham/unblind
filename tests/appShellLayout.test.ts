import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const globalStyles = readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
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

  it('never lets a hidden launch splash keep the root safe area orange', () => {
    expect(globalStyles).not.toContain('html:has(.ub-launch-splash)')
    expect(globalStyles).not.toContain('body:has(.ub-launch-splash)')
  })
})
