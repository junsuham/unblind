import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { emoji3DAssets } from '../src/lib/emoji3d'

const assetNames = Object.keys(emoji3DAssets)

describe('3D emoji image assets', () => {
  it('provides the complete shared 3D icon set', () => {
    expect(assetNames).toEqual([
      'prayer',
      'dove',
      'sun',
      'church',
      'hearts',
      'chat',
      'disc',
      'location',
      'headphones',
      'gift',
      'hourglass',
      'person',
      'prohibited',
      'bell',
      'musicDisc',
      'check',
    ])
  })

  it.each(Object.entries(emoji3DAssets))('%s is a transparent PNG on web and native', (_, asset) => {
    const filename = asset.src.split('/').at(-1)
    expect(filename).toBeTruthy()

    for (const relativePath of [
      `../public/icons/emoji-3d/${filename}`,
      `../mobile/assets/emoji-3d/${filename}`,
    ]) {
      const bytes = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)))
      expect(bytes.subarray(1, 4).toString()).toBe('PNG')
      expect([4, 6]).toContain(bytes[25])
    }
  })
})
