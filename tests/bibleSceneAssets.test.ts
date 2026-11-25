import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { bibleAvatarScenes } from '../src/lib/bibleAvatarScenes'

describe('shippable Bible avatar stage art', () => {
  it.each(bibleAvatarScenes)('ships a landscape and lightweight thumbnail for $name', async ({ src, thumbnailSrc }) => {
    const image = readFileSync(new URL(`../public${src}`, import.meta.url))
    const thumb = readFileSync(new URL(`../public${thumbnailSrc}`, import.meta.url))
    expect(await sharp(image).metadata()).toMatchObject({ format: 'webp', width: 960, height: 540, hasAlpha: false })
    expect(await sharp(thumb).metadata()).toMatchObject({ format: 'webp', width: 320, height: 180, hasAlpha: false })
    expect(image.byteLength).toBeLessThan(250_000)
    expect(thumb.byteLength).toBeLessThan(image.byteLength / 4)
  })
})
