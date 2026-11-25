import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  faithExpressionAtlasSrc,
  faithExpressionFrameHeight,
  faithExpressionFrames,
  faithExpressionFrameWidth,
} from '../src/lib/faithAvatarExpression'
import { bibleAvatarPresets } from '../src/lib/pixelAvatar'

describe('Bible avatar expression atlases', () => {
  it.each(bibleAvatarPresets)('keeps the original $name silhouette and redraws five distinct faces', async ({ id, src }) => {
    const read = (path: string) => readFileSync(new URL(`../public${path}`, import.meta.url))
    const asset = read(faithExpressionAtlasSrc(id))
    expect(asset.byteLength).toBeLessThan(55_000)

    const width = faithExpressionFrameWidth
    const height = faithExpressionFrameHeight
    const atlasWidth = faithExpressionFrames.length * width
    const sprite = await sharp(read(src)).ensureAlpha().raw().toBuffer()
    const atlas = await sharp(asset).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    expect(atlas.info).toMatchObject({ width: atlasWidth, height, channels: 4 })

    const frameHashes = new Set<string>()
    for (let frame = 0; frame < faithExpressionFrames.length; frame++) {
      const rows: Buffer[] = []
      let changed = 0
      let changedOutsideFace = 0
      let changedAlpha = 0
      for (let y = 0; y < height; y++) {
        const start = (y * atlasWidth + frame * width) * 4
        const row = atlas.data.subarray(start, start + width * 4)
        rows.push(row)
        for (let x = 0; x < width; x++) {
          const original = (y * width + x) * 4
          const pixel = x * 4
          if (row[pixel + 3] !== sprite[original + 3]) changedAlpha++
          if (sprite[original + 3] === 0) continue
          if (row[pixel] === sprite[original]
            && row[pixel + 1] === sprite[original + 1]
            && row[pixel + 2] === sprite[original + 2]) continue
          changed++
          if (x < 76 || x > 146 || y < 67 || y > 123) changedOutsideFace++
        }
      }
      expect(changedAlpha).toBe(0)
      expect(changedOutsideFace).toBe(0)
      if (frame === 0) expect(changed).toBe(0)
      else {
        expect(changed).toBeGreaterThan(60)
        expect(changed).toBeLessThan(1_500)
      }
      frameHashes.add(createHash('sha256').update(Buffer.concat(rows)).digest('hex'))
    }
    expect(frameHashes.size).toBe(faithExpressionFrames.length)
  })
})
