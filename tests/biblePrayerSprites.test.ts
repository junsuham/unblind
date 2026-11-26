import { readdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { bibleAvatarPresets } from '../src/lib/pixelAvatar'

const pack = new URL('../public/avatars/bible-prayer-v1/', import.meta.url)
const sceneCss = readFileSync(new URL('../src/app/pray/PrayerRoomScene.module.css', import.meta.url), 'utf8')

async function visibleBounds(data: Buffer) {
  const { data: rgba, info } = await sharp(data).raw().toBuffer({ resolveWithObject: true })
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
  return { info, minX, minY, maxX, maxY }
}

describe('kneeling Bible sprites', () => {
  it('provides a separate sprite for every selectable character and no extra variants', () => {
    expect(readdirSync(pack).sort()).toEqual(bibleAvatarPresets.map(({ id }) => `${id}.webp`).sort())
  })

  it.each(bibleAvatarPresets)('matches the rendered standing height and ground anchor for $name', async ({ id, src }) => {
    const data = readFileSync(new URL(`${id}.webp`, pack))
    const [pose, standing] = await Promise.all([
      visibleBounds(data),
      visibleBounds(readFileSync(new URL(`../public${src}`, import.meta.url))),
    ])
    const { info, minX, minY, maxX, maxY } = pose
    expect(info).toMatchObject({ width: 192, height: 224, channels: 4 })
    expect(data.byteLength).toBeLessThan(70_000)
    expect(minX).toBeGreaterThanOrEqual(8)
    expect(maxX).toBeLessThan(info.width - 8)
    expect(minY).toBeGreaterThanOrEqual(56)
    expect(maxY).toBeGreaterThanOrEqual(211)
    expect(maxY).toBeLessThan(216)

    const rule = sceneCss.match(/\[data-praying='true'\] > \.avatarArt\[data-has-pose\] \.kneelingSprite\s*\{([^}]+)\}/)?.[1]
    const scale = Number(rule?.match(/scale\(([\d.]+)\)/)?.[1])
    const floor = info.height * Number(rule?.match(/transform-origin: center ([\d.]+)%/)?.[1]) / 100
    const renderedHeight = (maxY - minY + 1) * scale
    const renderedFloor = floor + (maxY + 1 - floor) * scale
    expect(Math.abs(renderedHeight - (standing.maxY - standing.minY + 1))).toBeLessThan(1)
    expect(Math.abs(renderedFloor - (standing.maxY + 1))).toBeLessThan(1)
    expect(Math.max(info.width / 2 - minX, maxX + 1 - info.width / 2) * scale).toBeLessThan(info.width / 2)
  })
})
