export type PixelHairStyle = 'short' | 'long' | 'up'
export type PixelHat = 'none' | 'cap' | 'beanie'
export type PixelFaceAccessory = 'none' | 'glasses'
export type PixelCape = 'none' | 'scarf'
export type PixelProp = 'none' | 'book'

export type PixelAvatarAppearance = {
  skin: string
  hair: string
  eyes: string
  top: string
  bottom: string
  shoes: string
  hairStyle: PixelHairStyle
  hat: PixelHat
  faceAccessory: PixelFaceAccessory
  cape: PixelCape
  prop: PixelProp
}

export const defaultPixelAvatar: PixelAvatarAppearance = {
  skin: '#efb98e',
  hair: '#3b2924',
  eyes: '#352b29',
  top: '#e45330',
  bottom: '#474039',
  shoes: '#282322',
  hairStyle: 'short',
  hat: 'none',
  faceAccessory: 'none',
  cape: 'none',
  prop: 'none',
}

const colorPattern = /^#[0-9a-f]{6}$/i
const styles = ['short', 'long', 'up']
const hats = ['none', 'cap', 'beanie']
const faceAccessories = ['none', 'glasses']
const capes = ['none', 'scarf']
const props = ['none', 'book']

export function isPixelAvatarAppearance(value: unknown): value is PixelAvatarAppearance {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['skin', 'hair', 'eyes', 'top', 'bottom', 'shoes'].every((key) =>
    typeof item[key] === 'string' && colorPattern.test(item[key]))
    && styles.includes(String(item.hairStyle))
    && hats.includes(String(item.hat))
    && faceAccessories.includes(String(item.faceAccessory))
    && capes.includes(String(item.cape))
    && props.includes(String(item.prop))
}

export function avatarStorageKey(scope: string) {
  return `unblind-pixel-avatar:${scope}`
}

export function readPixelAvatar(scope: string): PixelAvatarAppearance {
  if (typeof window === 'undefined') return defaultPixelAvatar
  try {
    const stored = window.localStorage.getItem(avatarStorageKey(scope))
    if (!stored) return defaultPixelAvatar
    const parsed: unknown = JSON.parse(stored)
    return isPixelAvatarAppearance(parsed) ? parsed : defaultPixelAvatar
  } catch {
    return defaultPixelAvatar
  }
}

export function savePixelAvatar(scope: string, appearance: PixelAvatarAppearance) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(avatarStorageKey(scope), JSON.stringify(appearance))
    window.dispatchEvent(new CustomEvent('unblind:pixel-avatar-updated', { detail: scope }))
  } catch {
    // The preview remains usable when local storage is unavailable.
  }
}

function toHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function averageRegion(
  pixels: Uint8ClampedArray,
  width: number,
  bounds: [number, number, number, number],
  fallback: string,
  accept: (red: number, green: number, blue: number) => boolean,
) {
  const [x0, y0, x1, y1] = bounds
  let red = 0
  let green = 0
  let blue = 0
  let count = 0
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const index = (y * width + x) * 4
      const r = pixels[index]
      const g = pixels[index + 1]
      const b = pixels[index + 2]
      if (pixels[index + 3] < 200 || !accept(r, g, b)) continue
      red += r
      green += g
      blue += b
      count += 1
    }
  }
  return count < 8 ? fallback : toHex(red / count, green / count, blue / count)
}

/** Returns only coarse palette hints. The original photo is never uploaded or stored. */
export async function appearanceFromPhoto(file: File, current: PixelAvatarAppearance) {
  if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) {
    throw new Error('12MB 이하의 사진을 선택해주세요.')
  }
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('이 기기에서 사진을 분석할 수 없습니다.')

  let source: ImageBitmap | HTMLImageElement | null = null
  let objectUrl: string | null = null
  try {
    if (typeof createImageBitmap === 'function') {
      try {
        source = await createImageBitmap(file)
      } catch {
        // Some iOS browsers can display a photo but cannot make an ImageBitmap from it.
      }
    }
    if (!source) {
      objectUrl = URL.createObjectURL(file)
      const image = new window.Image()
      image.src = objectUrl
      await image.decode()
      source = image
    }
    const width = source.width
    const height = source.height
    const side = Math.min(width, height)
    context.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, 96, 96)
    const { data } = context.getImageData(0, 0, 96, 96)
    const hair = averageRegion(data, 96, [24, 9, 73, 35], current.hair,
      (r, g, b) => r + g + b < 560 && Math.max(r, g, b) - Math.min(r, g, b) > 10)
    const skin = averageRegion(data, 96, [35, 39, 63, 66], current.skin,
      (r, g, b) => r > 80 && r > b * 1.08 && g > b * 0.78 && r + g + b < 700)
    const top = averageRegion(data, 96, [27, 70, 70, 92], current.top,
      (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 24 && r + g + b < 680)
    let sideHair = 0
    for (let y = 38; y < 67; y += 3) {
      for (const x of [25, 29, 67, 71]) {
        const index = (y * 96 + x) * 4
        if (data[index] + data[index + 1] + data[index + 2] < 330) sideHair += 1
      }
    }
    return { ...current, skin, hair, top, hairStyle: sideHair >= 20 ? 'long' : 'short' } satisfies PixelAvatarAppearance
  } catch {
    throw new Error('사진을 읽지 못했습니다. JPG·PNG·HEIC 사진으로 다시 시도해주세요.')
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    if (source && typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close()
  }
}

