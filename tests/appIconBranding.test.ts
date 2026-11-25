import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import manifest from '../src/app/manifest'

const asset = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url))

describe('flat Unblind app mark', () => {
  it.each([
    ['icon-192-v7.png', 192],
    ['icon-512-v7.png', 512],
    ['apple-touch-icon-v7.png', 180],
  ] as const)('keeps %s centered on the same full-bleed orange', async (name, size) => {
    const { data, info } = await sharp(asset(`public/icons/${name}`)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    expect(info).toMatchObject({ width: size, height: size, channels: 3 })
    expect([...data.subarray(0, 3)]).toEqual([228, 83, 48])
    let symbolPixels = 0
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * 3 + 1] < 130) continue
      if (Math.hypot(x - size / 2, y - size / 2) > 0.40 * size) {
        throw new Error('The mark exceeds the maskable icon safe area')
      }
      symbolPixels++
    }
    expect(symbolPixels).toBeGreaterThan(size * size * 0.07)
  })

  it('matches the installation manifest and Next.js metadata icon files', () => {
    expect(manifest().icons).toContainEqual(expect.objectContaining({
      src: '/icons/icon-512-v7.png', purpose: 'maskable',
    }))
    expect(asset('src/app/apple-icon.png')).toEqual(asset('public/icons/apple-touch-icon-v7.png'))
    expect(asset('src/app/icon.png')).toEqual(asset('public/icons/icon-512-v7.png'))
  })
})
