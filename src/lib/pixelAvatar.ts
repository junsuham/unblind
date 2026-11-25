export const DEFAULT_PIXEL_SPRITE = '/avatars/faith-player-reference-v2.png'

export type GeneratedPixelAvatar = { sprite: string; background: string }

const DATABASE = 'unblind-faith-avatar-v2'
const STORE = 'characters'
const MAX_STORED_IMAGE_LENGTH = 2_500_000
const MAX_IMPORT_BYTES = 12 * 1024 * 1024
const MAX_IMPORT_DIMENSION = 4096
const MAX_IMPORT_PIXELS = 12_000_000
export const PIXEL_AVATAR_UPDATED_EVENT = 'unblind:generated-pixel-avatar-updated'
const imageDataPattern = /^data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/

type ImageInfo = { type: 'image/png' | 'image/webp' | 'image/jpeg'; width: number; height: number }
type SpriteBounds = { x: number; y: number; width: number; height: number }

export function isGeneratedPixelAvatar(value: unknown): value is GeneratedPixelAvatar {
  if (!value || typeof value !== 'object') return false
  const images = value as Record<string, unknown>
  return [images.sprite, images.background].every((image) => (
    typeof image === 'string' && image.length <= MAX_STORED_IMAGE_LENGTH && imageDataPattern.test(image)
  ))
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode)
      const request = operation(transaction.objectStore(STORE))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error ?? new Error('저장 작업이 중단됐어요.'))
    })
  } finally {
    database.close()
  }
}

export async function readGeneratedAvatar(scope: string) {
  const value: unknown = await withStore('readonly', (store) => store.get(scope))
  return isGeneratedPixelAvatar(value) ? value : null
}

export async function writeGeneratedAvatar(scope: string, avatar: GeneratedPixelAvatar | null) {
  if (avatar) {
    if (!isGeneratedPixelAvatar(avatar)) throw new Error('캐릭터 이미지 형식이 올바르지 않아요.')
    await withStore('readwrite', (store) => store.put({ sprite: avatar.sprite, background: avatar.background }, scope))
  } else {
    await withStore('readwrite', (store) => store.delete(scope))
  }
  window.dispatchEvent(new CustomEvent(PIXEL_AVATAR_UPDATED_EVENT, { detail: scope }))
}

export function inspectAvatarImage(buffer: ArrayBuffer): ImageInfo | null {
  const view = new DataView(buffer)
  const matches = (offset: number, label: string) => (
    offset + label.length <= view.byteLength &&
    Array.from(label).every((character, index) => view.getUint8(offset + index) === character.charCodeAt(0))
  )
  const size = (type: ImageInfo['type'], width: number, height: number): ImageInfo | null => (
    width > 0 && height > 0 ? { type, width, height } : null
  )

  if (view.byteLength >= 33 && view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
    if (view.getUint32(8) !== 13 || !matches(12, 'IHDR')) return null
    for (let offset = 8; offset + 12 <= view.byteLength;) {
      const length = view.getUint32(offset)
      if (length > view.byteLength - offset - 12 || matches(offset + 4, 'acTL')) return null
      if (matches(offset + 4, 'IEND')) return size('image/png', view.getUint32(16), view.getUint32(20))
      offset += length + 12
    }
    return null
  }

  if (view.byteLength >= 20 && matches(0, 'RIFF') && matches(8, 'WEBP')) {
    if (view.getUint32(4, true) + 8 !== view.byteLength) return null
    let dimensions: ImageInfo | null = null
    const uint24 = (offset: number) => view.getUint8(offset) + 256 * view.getUint16(offset + 1, true)
    for (let offset = 12; offset + 8 <= view.byteLength;) {
      const length = view.getUint32(offset + 4, true)
      const data = offset + 8
      if (length > view.byteLength - data || matches(offset, 'ANIM') || matches(offset, 'ANMF')) return null
      if (matches(offset, 'VP8X')) {
        if (length !== 10 || (view.getUint8(data) & 0x02)) return null
        dimensions = size('image/webp', uint24(data + 4) + 1, uint24(data + 7) + 1)
      } else if (!dimensions && length >= 10 && matches(offset, 'VP8 ')) {
        dimensions = size('image/webp', view.getUint16(data + 6, true) & 0x3fff, view.getUint16(data + 8, true) & 0x3fff)
      } else if (!dimensions && length >= 5 && matches(offset, 'VP8L')) {
        const packed = view.getUint32(data + 1, true)
        dimensions = size('image/webp', (packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1)
      }
      offset = data + length + (length % 2)
    }
    return dimensions
  }

  if (view.byteLength >= 4 && view.getUint16(0) === 0xffd8) {
    for (let offset = 2; offset + 1 < view.byteLength;) {
      if (view.getUint8(offset++) !== 0xff) return null
      while (offset < view.byteLength && view.getUint8(offset) === 0xff) offset++
      if (offset + 2 >= view.byteLength) return null
      const marker = view.getUint8(offset++)
      if (marker === 0xda || marker === 0xd9) return null
      const length = view.getUint16(offset)
      if (length < 2 || length > view.byteLength - offset) return null
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return length >= 8 ? size('image/jpeg', view.getUint16(offset + 5), view.getUint16(offset + 3)) : null
      }
      offset += length
    }
  }
  return null
}

export function findAvatarSpriteBounds(pixels: Uint8ClampedArray, width: number, height: number): SpriteBounds | null {
  let left = width
  let right = -1
  let top = height
  let bottom = -1
  let transparentPixels = 0
  let hasVisiblePixels = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      if (alpha <= 8) {
        transparentPixels++
        continue
      }
      if (alpha >= 128) hasVisiblePixels = true
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (!hasVisiblePixels || transparentPixels < width * height * .02) return null
  // Preserve a little edge space and any nearly transparent antialiasing.
  const x = Math.max(0, left - 2)
  const y = Math.max(0, top - 2)
  return {
    x,
    y,
    width: Math.min(width, right + 3) - x,
    height: Math.min(height, bottom + 3) - y,
  }
}

function sizedCanvas(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  return canvas
}

function checkDimensions(width: number, height: number) {
  if (
    !width || !height || width > MAX_IMPORT_DIMENSION || height > MAX_IMPORT_DIMENSION ||
    width * height > MAX_IMPORT_PIXELS
  ) {
    throw new Error('이미지가 너무 커요. 한 변 4,096px 이하, 총 1,200만 픽셀 이하로 줄여주세요.')
  }
}

function makeSprite(source: CanvasImageSource, width: number, height: number) {
  const preview = sizedCanvas(width, height, 1024)
  const previewContext = preview.getContext('2d', { willReadFrequently: true })
  if (!previewContext) throw new Error('이 브라우저에서 이미지를 처리할 수 없어요.')
  try {
    previewContext.imageSmoothingEnabled = false
    previewContext.drawImage(source, 0, 0, preview.width, preview.height)
    const pixels = previewContext.getImageData(0, 0, preview.width, preview.height).data
    const bounds = findAvatarSpriteBounds(pixels, preview.width, preview.height)
    if (!bounds) throw new Error('배경이 투명하고 캐릭터가 보이는 PNG 또는 WebP를 선택해주세요.')

    const left = Math.floor(bounds.x * width / preview.width)
    const top = Math.floor(bounds.y * height / preview.height)
    const right = Math.ceil((bounds.x + bounds.width) * width / preview.width)
    const bottom = Math.ceil((bounds.y + bounds.height) * height / preview.height)
    const output = sizedCanvas(right - left, bottom - top, 640)
    try {
      const context = output.getContext('2d')
      if (!context) throw new Error('이 브라우저에서 이미지를 처리할 수 없어요.')
      context.imageSmoothingEnabled = false
      context.drawImage(source, left, top, right - left, bottom - top, 0, 0, output.width, output.height)
      return output.toDataURL('image/png')
    } finally {
      output.width = 0
    }
  } finally {
    preview.width = 0
  }
}

function makeBackground(source: CanvasImageSource, width: number, height: number) {
  const output = sizedCanvas(width, height, 1280)
  try {
    const context = output.getContext('2d', { alpha: false })
    if (!context) throw new Error('이 브라우저에서 이미지를 처리할 수 없어요.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, output.width, output.height)
    context.imageSmoothingEnabled = false
    context.drawImage(source, 0, 0, output.width, output.height)
    return output.toDataURL('image/jpeg', .92)
  } finally {
    output.width = 0
  }
}

async function importAvatarImage(file: File, role: 'sprite' | 'background') {
  const label = role === 'sprite' ? '캐릭터' : '배경'
  if (!file.size || file.size > MAX_IMPORT_BYTES) throw new Error(`${label} 파일은 12MB 이하로 선택해주세요.`)

  const info = inspectAvatarImage(await file.arrayBuffer())
  if (!info || (role === 'sprite' && info.type === 'image/jpeg')) {
    throw new Error(role === 'sprite'
      ? '캐릭터는 투명한 PNG 또는 WebP 정지 이미지로 선택해주세요.'
      : '배경은 PNG, JPG 또는 WebP 정지 이미지로 선택해주세요.')
  }
  checkDimensions(info.width, info.height)

  // Build a local object URL from verified image bytes, never a user-supplied URL.
  const url = URL.createObjectURL(new Blob([file], { type: info.type }))
  try {
    const image = new Image()
    image.src = url
    try {
      await image.decode()
    } catch {
      throw new Error(`${label} 이미지를 읽을 수 없어요. 파일을 다시 저장해 선택해주세요.`)
    }
    checkDimensions(image.naturalWidth, image.naturalHeight)
    return role === 'sprite'
      ? makeSprite(image, image.naturalWidth, image.naturalHeight)
      : makeBackground(image, image.naturalWidth, image.naturalHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Validate, trim, and re-encode the two local files without uploading them. */
export async function prepareImportedAvatar(spriteFile: File, backgroundFile: File): Promise<GeneratedPixelAvatar> {
  const result = {
    sprite: await importAvatarImage(spriteFile, 'sprite'),
    background: await importAvatarImage(backgroundFile, 'background'),
  }
  if (!isGeneratedPixelAvatar(result)) {
    throw new Error('이미지를 저장할 수 없어요. 더 작은 파일을 선택한 뒤 다시 시도해주세요.')
  }
  return result
}
