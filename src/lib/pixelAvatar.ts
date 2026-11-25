export const DEFAULT_PIXEL_SPRITE = '/avatars/faith-player-reference-v2.png'
export const PIXEL_AVATAR_ENDPOINT = '/api/faith-avatar/generate'

export type GeneratedPixelAvatar = { sprite: string; background: string }
export type PixelHairStyle = '' | 'short' | 'long' | 'up'
export const pixelColorFields = [
  ['skin', '피부', '#efb98e'], ['hair', '머리', '#3b2924'], ['eyes', '눈', '#352b29'],
  ['top', '상의', '#e45330'], ['bottom', '하의', '#474039'], ['shoes', '신발', '#282322'],
] as const
export type PixelColorField = (typeof pixelColorFields)[number][0]

const DATABASE = 'unblind-faith-avatar-v2'
const STORE = 'characters'
export const PIXEL_AVATAR_UPDATED_EVENT = 'unblind:generated-pixel-avatar-updated'
const imageDataPattern = /^data:image\/(?:png|webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/

export function isGeneratedPixelAvatar(value: unknown): value is GeneratedPixelAvatar {
  if (!value || typeof value !== 'object') return false
  const images = value as Record<string, unknown>
  return [images.sprite, images.background].every((image) => (
    typeof image === 'string' && image.length <= 2_500_000 && imageDataPattern.test(image)
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

/** Resize and strip original metadata before sending a photo to the generation API. */
export async function prepareAvatarPhoto(file: File) {
  if (file.size === 0 || file.size > 12 * 1024 * 1024) {
    throw new Error('12MB 이하의 사진을 선택해주세요.')
  }

  let url: string | undefined
  let bitmap: ImageBitmap | undefined
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file).catch(() => undefined)
    }
    let source: HTMLImageElement | ImageBitmap
    if (bitmap) {
      source = bitmap
    } else {
      url = URL.createObjectURL(file)
      const image = new Image()
      image.src = url
      await image.decode()
      source = image
    }

    const scale = Math.min(1, 1024 / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.width * scale))
    canvas.height = Math.max(1, Math.round(source.height * scale))
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('사진을 변환할 수 없어요.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', .88))
    if (!jpeg || jpeg.type !== 'image/jpeg' || jpeg.size > 1.5 * 1024 * 1024) {
      throw new Error('사진 크기를 줄일 수 없어요.')
    }
    return jpeg
  } catch {
    throw new Error('사진을 읽지 못했어요. 다른 JPG·PNG 사진으로 다시 시도해주세요.')
  } finally {
    bitmap?.close()
    if (url) URL.revokeObjectURL(url)
  }
}
