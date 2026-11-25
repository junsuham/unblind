import { readdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { bibleAvatarPresets } from '../src/lib/pixelAvatar'

const pack = new URL('../public/avatars/bible-prayer-v1/', import.meta.url)

describe('kneeling Bible sprites', () => {
  it('provides a separate sprite for every selectable character and no extra variants', () => {
    expect(readdirSync(pack).sort()).toEqual(bibleAvatarPresets.map(({ id }) => `${id}.webp`).sort())
  })

  it.each(bibleAvatarPresets)('keeps $name on the standing sprite canvas with a lower body silhouette', async ({ id }) => {
    const data = readFileSync(new URL(`${id}.webp`, pack))
    const { data: rgba, info } = await sharp(data).raw().toBuffer({ resolveWithObject: true })
    expect(info).toMatchObject({ width: 192, height: 224, channels: 4 })
    expect(data.byteLength).toBeLessThan(70_000)
    let minX = info.width
    let minY = info.height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (rgba[(y * info.width + x) * 4 + 3]! < 32) continue
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
    expect(minX).toBeGreaterThanOrEqual(8)
    expect(maxX).toBeLessThan(info.width - 8)
    expect(minY).toBeGreaterThanOrEqual(56)
    expect(maxY).toBeGreaterThanOrEqual(211)
    expect(maxY).toBeLessThan(216)
    expect(maxY - minY).toBeGreaterThan(110)
  })
})
