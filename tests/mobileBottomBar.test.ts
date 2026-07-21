import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tabLayout = readFileSync(
  new URL('../mobile/src/app/(tabs)/_layout.tsx', import.meta.url),
  'utf8',
)
const screen = readFileSync(
  new URL('../mobile/src/components/Screen.tsx', import.meta.url),
  'utf8',
)
const design = readFileSync(
  new URL('../mobile/src/constants/design.ts', import.meta.url),
  'utf8',
)
const bootstrap = readFileSync(
  new URL('../mobile/src/components/AppBootstrapScreen.tsx', import.meta.url),
  'utf8',
)

describe('native bottom tab bar', () => {
  it('removes the dock surface while keeping navigation controls', () => {
    expect(tabLayout).toContain("position: 'absolute'")
    expect(tabLayout).toContain("backgroundColor: 'transparent'")
    expect(tabLayout).toContain('tabBarBackground: () => null')
    expect(tabLayout).toContain('borderTopWidth: 0')
    expect(tabLayout).toContain('shadowOpacity: 0')
    expect(tabLayout).toContain('elevation: 0')
    expect(tabLayout).not.toContain('bottom: 16')
    expect(tabLayout).not.toContain('paddingBottom: 9')
    expect(tabLayout).not.toContain('backgroundColor: colors.tabSurface')
  })

  it('keeps the visible icon controls compact and readable without a dock', () => {
    expect(tabLayout).not.toContain('useSafeAreaInsets')
    expect(tabLayout).toContain('height: 60')
    expect(tabLayout).toContain('paddingBottom: 5')
    expect(tabLayout).toContain('size={18}')
    expect(tabLayout).toContain('fontSize: 10')
    expect(tabLayout).toContain('textShadowColor')
  })

  it('retains reusable neutral surfaces for non-navigation screens', () => {
    expect(design).toContain("tabSurface: '#FFFFFF'")
    expect(design).toContain("tabSurface: '#1D1D1F'")
  })

  it('does not keep the old floating-bar scroll spacer', () => {
    expect(screen).not.toContain('paddingBottom: 120')
    expect(screen).toContain('paddingBottom: 32')
  })

  it('uses the dock surface instead of orange during app bootstrap', () => {
    expect(bootstrap).toContain('backgroundColor: colors.tabSurface')
    expect(bootstrap).not.toContain('backgroundColor: colors.background')
  })
})
