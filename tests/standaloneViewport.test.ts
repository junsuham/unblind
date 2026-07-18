import { describe, expect, it } from 'vitest'
import { getStandaloneBottomCompensation } from '../src/lib/standaloneViewport'

describe('standalone viewport compensation', () => {
  it('does not alter regular Safari layout', () => {
    expect(getStandaloneBottomCompensation({
      isStandalone: false,
      safeAreaBottom: 34,
      screenHeight: 852,
      viewportHeight: 758,
    })).toBe(0)
  })

  it('extends only by the safe area when iOS already excluded it', () => {
    expect(getStandaloneBottomCompensation({
      isStandalone: true,
      safeAreaBottom: 34,
      screenHeight: 852,
      viewportHeight: 758,
    })).toBe(34)
  })

  it('does not extend a standalone viewport that already covers the screen', () => {
    expect(getStandaloneBottomCompensation({
      isStandalone: true,
      safeAreaBottom: 34,
      screenHeight: 852,
      viewportHeight: 852,
    })).toBe(0)
  })

  it('never extends farther than the excluded viewport height', () => {
    expect(getStandaloneBottomCompensation({
      isStandalone: true,
      safeAreaBottom: 34,
      screenHeight: 852,
      viewportHeight: 842,
    })).toBe(10)
  })
})
