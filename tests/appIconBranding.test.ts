import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import manifest from '../src/app/manifest'

const asset = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url))

describe('Unblind launcher branding stays separate from the in-app drawer', () => {
  it.each([
    ['icon-192-v6.png', 192, 'ae1df9850d5d4015ac30507db18321284000ae142bad156878ae2673da533d8e'],
    ['icon-512-v6.png', 512, 'bad78cbfb4b36dc6d3844f92f05e4dfa072b3e266be4bfba280a590215528df9'],
    ['apple-touch-icon-v6.png', 180, 'abd5c071bd5639d717dea6fb802de14d98feaec1362e45535215e7360ed9e80f'],
  ] as const)('preserves the original %s artwork', async (name, size, checksum) => {
    const image = asset(`public/icons/${name}`)
    expect(createHash('sha256').update(image).digest('hex')).toBe(checksum)
    await expect(sharp(image).metadata()).resolves.toMatchObject({ width: size, height: size, format: 'png' })
  })

  it('matches the installation manifest and Next.js metadata icon files', () => {
    expect(manifest().icons).toContainEqual(expect.objectContaining({
      src: '/icons/icon-512-v6.png', purpose: 'maskable',
    }))
    expect(manifest().shortcuts?.every(({ icons }) => icons?.[0]?.src === '/icons/icon-192-v6.png')).toBe(true)
    expect(asset('src/app/apple-icon.png')).toEqual(asset('public/icons/apple-touch-icon-v6.png'))
    expect(asset('src/app/icon.png')).toEqual(asset('public/icons/icon-512-v6.png'))
  })
})
