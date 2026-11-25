import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { findAvatarSpriteBounds, inspectAvatarImage, prepareImportedAvatar } from '../src/lib/pixelAvatar'

const signature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)

function pngHeader(width: number, height: number, animated = false) {
  const header = new Uint8Array(animated ? 65 : 45)
  const view = new DataView(header.buffer)
  header.set(signature)
  view.setUint32(8, 13)
  header.set(new TextEncoder().encode('IHDR'), 12)
  view.setUint32(16, width)
  view.setUint32(20, height)
  if (animated) {
    view.setUint32(33, 8)
    header.set(new TextEncoder().encode('acTL'), 37)
  }
  header.set(new TextEncoder().encode('IEND'), animated ? 57 : 37)
  return header
}

function rgba(width: number, height: number, alpha: (x: number, y: number) => number) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels[(y * width + x) * 4 + 3] = alpha(x, y)
    }
  }
  return pixels
}

describe('local avatar image import', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recognizes the supplied PNG by bytes and rejects animation and bogus data', () => {
    const sprite = readFileSync(new URL('../public/avatars/faith-player-reference-v2.png', import.meta.url))
    expect(inspectAvatarImage(Uint8Array.from(sprite).buffer)).toMatchObject({ type: 'image/png' })
    expect(inspectAvatarImage(pngHeader(640, 480, true).buffer)).toBeNull()
    expect(inspectAvatarImage(new TextEncoder().encode('<svg onload="alert(1)">').buffer)).toBeNull()
    expect(inspectAvatarImage(signature.buffer)).toBeNull()
  })

  it('rejects animated WebP and accepts WebP and JPEG dimensions from bytes', () => {
    const webp = new Uint8Array(30)
    webp.set(new TextEncoder().encode('RIFF'))
    webp.set(new TextEncoder().encode('WEBPVP8X'), 8)
    const view = new DataView(webp.buffer)
    view.setUint32(4, 22, true)
    view.setUint32(16, 10, true)
    webp[24] = 63
    webp[27] = 47
    expect(inspectAvatarImage(webp.buffer)).toEqual({ type: 'image/webp', width: 64, height: 48 })
    webp[20] = 0x02
    expect(inspectAvatarImage(webp.buffer)).toBeNull()

    const jpeg = Uint8Array.of(0xff, 0xd8, 0xff, 0xc0, 0, 8, 8, 0, 48, 0, 64, 3, 0xff, 0xd9)
    expect(inspectAvatarImage(jpeg.buffer)).toEqual({ type: 'image/jpeg', width: 64, height: 48 })
  })

  it('crops transparent margins and retains semitransparent outlines without clipping', () => {
    const pixels = rgba(16, 12, (x, y) => x >= 5 && x <= 8 && y >= 4 && y <= 7 ? 255 : x === 4 && y === 4 ? 64 : 0)
    expect(findAvatarSpriteBounds(pixels, 16, 12)).toEqual({ x: 2, y: 2, width: 9, height: 8 })
    expect(findAvatarSpriteBounds(rgba(16, 12, () => 0), 16, 12)).toBeNull()
    expect(findAvatarSpriteBounds(rgba(16, 12, () => 255), 16, 12)).toBeNull()
  })

  it('rejects oversized and unsupported files before browser decoding', async () => {
    const good = new File([pngHeader(16, 12)], 'background.png', { type: 'image/png' })
    const large = new File([pngHeader(4097, 2000)], 'large.png', { type: 'image/png' })
    await expect(prepareImportedAvatar(large, good)).rejects.toThrow('이미지가 너무 커요.')
    await expect(prepareImportedAvatar(new File(['not an image'], 'broken.png', { type: 'image/png' }), good))
      .rejects.toThrow('투명한 PNG 또는 WebP')
    await expect(prepareImportedAvatar(new File([], 'empty.png'), good)).rejects.toThrow('12MB 이하')
  })

  it('normalizes separate local files without calling fetch', async () => {
    const drawImage = vi.fn()
    const fillRect = vi.fn()
    const toDataURL = vi.fn((type) => `data:${type};base64,AA==`)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('Image', class {
      src = ''
      naturalWidth = 16
      naturalHeight = 12
      decode = vi.fn().mockResolvedValue(undefined)
    })
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => ({
          drawImage,
          fillRect,
          getImageData: () => ({ data: rgba(16, 12, (x, y) => x >= 5 && x <= 8 && y >= 4 && y <= 7 ? 255 : 0) }),
        }),
        toDataURL,
      }),
    })

    const file = new File([pngHeader(16, 12)], 'sprite.png', { type: 'image/png' })
    expect(await prepareImportedAvatar(file, file)).toEqual({
      sprite: 'data:image/png;base64,AA==',
      background: 'data:image/jpeg;base64,AA==',
    })
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 3, 2, 8, 8, 0, 0, 8, 8)
    expect(fillRect).toHaveBeenCalledOnce()
    expect(toDataURL.mock.calls).toEqual([['image/png'], ['image/jpeg', .92]])
    expect(fetch).not.toHaveBeenCalled()
  })
})
