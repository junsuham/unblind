import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

function pngSize(relativePath: string) {
  const bytes = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)))
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

function pngColorType(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url))).readUInt8(25)
}

async function pngAlphaRange(relativePath: string) {
  const stats = await sharp(fileURLToPath(new URL(relativePath, import.meta.url))).stats()
  const alpha = stats.channels[3]
  return { min: alpha.min, max: alpha.max }
}

function jpegSize(relativePath: string) {
  const bytes = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)))
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])
  let offset = 2

  while (offset < bytes.length - 8) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = bytes[offset + 1]
    if (startOfFrameMarkers.has(marker)) {
      return {
        width: bytes.readUInt16BE(offset + 7),
        height: bytes.readUInt16BE(offset + 5),
      }
    }

    offset += 2 + bytes.readUInt16BE(offset + 2)
  }

  throw new Error(`JPEG dimensions not found: ${relativePath}`)
}

const shellSource = readFileSync(
  new URL('../src/app/components/ui/AppShell.tsx', import.meta.url),
  'utf8',
)
const webLoginSource = readFileSync(
  new URL('../src/app/login/page.tsx', import.meta.url),
  'utf8',
)
const splashSource = readFileSync(
  new URL('../src/app/components/AppLaunchSplash.tsx', import.meta.url),
  'utf8',
)
const webTokenSource = readFileSync(
  new URL('../src/app/styles/unblind-tokens.css', import.meta.url),
  'utf8',
)
const mobileThemeSource = readFileSync(
  new URL('../mobile/src/constants/design.ts', import.meta.url),
  'utf8',
)
const mobileLoginSource = readFileSync(
  new URL('../mobile/src/app/login.tsx', import.meta.url),
  'utf8',
)
const adminLayoutSource = readFileSync(
  new URL('../src/app/admin/layout.tsx', import.meta.url),
  'utf8',
)
const mobileScreenSource = readFileSync(
  new URL('../mobile/src/components/Screen.tsx', import.meta.url),
  'utf8',
)
const mobileHomeSource = readFileSync(
  new URL('../mobile/src/app/(tabs)/index.tsx', import.meta.url),
  'utf8',
)
const mobileConfigSource = readFileSync(
  new URL('../mobile/app.json', import.meta.url),
  'utf8',
)
const mobileConfig = JSON.parse(
  readFileSync(new URL('../mobile/app.json', import.meta.url), 'utf8'),
) as { expo: { icon: string; ios: { icon: string }; android: { adaptiveIcon: { foregroundImage: string } } } }

describe('relief brand logo set', () => {
  it('keeps the source compositions, transparent display logos, and opaque launcher icons', async () => {
    expect(jpegSize('../public/brand/unblind-monogram-relief-v4.jpg')).toEqual({ width: 800, height: 800 })
    expect(jpegSize('../public/brand/unblind-wordmark-relief-v4.jpg')).toEqual({ width: 1406, height: 310 })
    expect(jpegSize('../public/brand/unblind-slogan-relief-v4.jpg')).toEqual({ width: 810, height: 810 })
    expect(pngSize('../public/brand/unblind-monogram-relief-v5.png')).toEqual({ width: 800, height: 800 })
    expect(pngSize('../public/brand/unblind-wordmark-relief-v5.png')).toEqual({ width: 1406, height: 310 })
    expect(pngSize('../public/brand/unblind-slogan-relief-v5.png')).toEqual({ width: 810, height: 810 })
    expect(pngSize('../mobile/assets/brand/unblind-monogram-relief-v5.png')).toEqual({ width: 800, height: 800 })
    expect(pngSize('../mobile/assets/brand/unblind-wordmark-relief-v5.png')).toEqual({ width: 1406, height: 310 })
    expect(pngSize('../mobile/assets/brand/unblind-slogan-relief-v5.png')).toEqual({ width: 810, height: 810 })
    expect(pngColorType('../public/brand/unblind-monogram-relief-v5.png')).toBe(6)
    expect(pngColorType('../public/brand/unblind-wordmark-relief-v5.png')).toBe(6)
    expect(pngColorType('../public/brand/unblind-slogan-relief-v5.png')).toBe(6)
    expect(pngColorType('../mobile/assets/brand/unblind-monogram-relief-v5.png')).toBe(6)
    expect(pngColorType('../mobile/assets/brand/unblind-wordmark-relief-v5.png')).toBe(6)
    expect(pngColorType('../mobile/assets/brand/unblind-slogan-relief-v5.png')).toBe(6)
    await expect(pngAlphaRange('../public/brand/unblind-monogram-relief-v5.png')).resolves.toEqual({ min: 0, max: 255 })
    await expect(pngAlphaRange('../public/brand/unblind-wordmark-relief-v5.png')).resolves.toEqual({ min: 0, max: 255 })
    await expect(pngAlphaRange('../public/brand/unblind-slogan-relief-v5.png')).resolves.toEqual({ min: 0, max: 255 })
    expect(pngSize('../mobile/assets/brand/unblind-app-icon-v4.png')).toEqual({ width: 1024, height: 1024 })
    expect(pngSize('../src/app/icon.png')).toEqual({ width: 512, height: 512 })
    expect(pngSize('../src/app/apple-icon.png')).toEqual({ width: 180, height: 180 })
    expect(pngColorType('../mobile/assets/brand/unblind-app-icon-v4.png')).toBe(2)
  })

  it('uses each composition in the context where it remains legible', () => {
    expect(shellSource).toContain('/brand/unblind-monogram-relief-v5.png')
    expect(shellSource).toContain('/brand/unblind-wordmark-relief-v5.png')
    expect(webLoginSource).toContain('/brand/unblind-wordmark-relief-v5.png')
    expect(mobileLoginSource).toContain('unblind-wordmark-relief-v5.png')
    expect(splashSource).toContain('/brand/unblind-slogan-relief-v5.png')
    expect(adminLayoutSource).toContain('/brand/unblind-monogram-relief-v5.png')
    expect(mobileScreenSource).toContain('unblind-monogram-relief-v5.png')
    expect(mobileHomeSource).toContain('unblind-wordmark-relief-v5.png')
  })

  it('keeps the first-entry wordmark compact and uses one brand orange', () => {
    expect(webLoginSource).toContain('width={150}')
    expect(webLoginSource).toContain('height={33}')
    expect(webLoginSource).toContain('bg-[#e45330]')
    expect(webLoginSource).not.toContain('maskImage')
    expect(mobileLoginSource).toContain('height: 33')
    expect(mobileLoginSource).toContain('width: 150')
    expect(mobileLoginSource).toContain('backgroundColor: colors.wordmarkSurface')
    expect(mobileLoginSource).toContain('accessibilityLabel="UNBLIND"')
    expect(webTokenSource).toContain('--ub-color-brand: #e45330')
    expect(webTokenSource).toContain('--ub-color-brand-rgb: 228, 83, 48')
    expect(mobileThemeSource.match(/#E45330/g)?.length).toBeGreaterThanOrEqual(6)
  })

  it('keeps in-app logos subordinate to page content', () => {
    expect(shellSource).toContain('width={36}')
    expect(shellSource).toContain('height={36}')
    expect(shellSource).toContain('width={104}')
    expect(shellSource).toContain('height={23}')
    expect(splashSource).toContain('width={172}')
    expect(splashSource).toContain('height={172}')
    expect(adminLayoutSource).toContain('width={26}')
    expect(mobileScreenSource).toContain('height: 48')
    expect(mobileScreenSource).toContain('width: 48')
    expect(mobileHomeSource).toContain('width: 112')
    expect(mobileHomeSource).toContain('height: 25')
    expect(mobileConfigSource).toContain('"imageWidth": 172')
  })

  it('uses the monogram artwork for native launcher icons', () => {
    expect(mobileConfig.expo.icon).toBe('./assets/brand/unblind-app-icon-v4.png')
    expect(mobileConfig.expo.ios.icon).toBe('./assets/brand/unblind-app-icon-v4.png')
    expect(mobileConfig.expo.android.adaptiveIcon.foregroundImage).toBe('./assets/brand/unblind-app-icon-v4.png')
  })
})
