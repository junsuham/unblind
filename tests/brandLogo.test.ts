import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

function pngSize(relativePath: string) {
  const bytes = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)))
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

const shellSource = readFileSync(
  new URL('../src/app/components/ui/AppShell.tsx', import.meta.url),
  'utf8',
)
const webLoginSource = readFileSync(
  new URL('../src/app/login/page.tsx', import.meta.url),
  'utf8',
)
const mobileConfig = JSON.parse(
  readFileSync(new URL('../mobile/app.json', import.meta.url), 'utf8'),
) as { expo: { icon: string; ios: { icon: string }; android: { adaptiveIcon: { foregroundImage: string } } } }

describe('iOS glass brand logos', () => {
  it('keeps optimized wide and square assets on web and native', () => {
    expect(pngSize('../public/brand/unblind-wordmark-glass.png')).toEqual({ width: 1080, height: 361 })
    expect(pngSize('../public/brand/unblind-mark-glass.png')).toEqual({ width: 1024, height: 1024 })
    expect(pngSize('../mobile/assets/brand/unblind-wordmark-glass.png')).toEqual({ width: 1080, height: 361 })
    expect(pngSize('../mobile/assets/brand/unblind-mark-glass.png')).toEqual({ width: 1024, height: 1024 })
    expect(pngSize('../src/app/icon.png')).toEqual({ width: 512, height: 512 })
    expect(pngSize('../src/app/apple-icon.png')).toEqual({ width: 180, height: 180 })
  })

  it('uses the wordmark in wide contexts and the square mark in compact contexts', () => {
    expect(shellSource).toContain("title ? '/brand/unblind-mark-glass.png' : '/brand/unblind-wordmark-glass.png'")
    expect(webLoginSource).toContain('/brand/unblind-wordmark-glass.png')
  })

  it('uses the square glass mark for native launcher icons', () => {
    expect(mobileConfig.expo.icon).toBe('./assets/brand/unblind-mark-glass.png')
    expect(mobileConfig.expo.ios.icon).toBe('./assets/brand/unblind-mark-glass.png')
    expect(mobileConfig.expo.android.adaptiveIcon.foregroundImage).toBe('./assets/brand/unblind-mark-glass.png')
  })
})
