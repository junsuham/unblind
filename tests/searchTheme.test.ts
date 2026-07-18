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

describe('inline search appearance', () => {
  it('removes the focus rectangle from the search control only', () => {
    expect(globalStyles).toContain('.ub-search-control:focus-within')
    expect(globalStyles).toContain('.ub-search-input:focus-visible')
    expect(globalStyles).toContain('.ub-search-trigger:focus-visible')
    expect(globalStyles).toContain('outline: none !important;')
  })

  it('uses theme-aware semantic colors for the search field', () => {
    expect(appShell).toContain('bg-[var(--ub-surface-input)]')
    expect(appShell).toContain('text-[var(--ub-text-primary)]')
    expect(appShell).toContain('border-[var(--ub-control-border)]')
    expect(globalStyles).toContain('color-scheme: light dark;')
  })

  it('keeps the logo visible and expands only inside the remaining header space', () => {
    expect(appShell).toContain('ub-top-search min-w-0 flex-1')
    expect(appShell).toContain('searchOpen ? \'max-w-0 opacity-0\'')
    expect(globalStyles).toContain('@keyframes ub-search-expand')
    expect(globalStyles).toContain('transform-origin: right center;')
  })
})
