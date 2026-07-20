import type { Emoji3DName } from '@/lib/emoji3d'

export const boardPresentation: Record<
  string,
  { icon: Emoji3DName; name: string }
> = {
  prayer: { icon: 'prayer', name: '기도' },
  faith: { icon: 'dove', name: '신앙' },
  daily: { icon: 'sun', name: '일상' },
  church: { icon: 'church', name: '교회생활' },
  work: { icon: 'sun', name: '일상' },
  relationship: { icon: 'hearts', name: '연애/결혼' },
}

export function getBoardPresentation(board: string) {
  return boardPresentation[board] ?? { icon: 'chat' as const, name: '게시판' }
}

function hashSeed(seed: string) {
  let hash = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return Math.abs(hash >>> 0)
}

export function getAnonymousId(contextId: string, authorId?: string | null) {
  const number = (hashSeed(`${contextId}:${authorId ?? 'unknown'}`) % 9000) + 1000
  return `익명${number}`
}

export function formatRelativeTime(value: string) {
  const date = new Date(value)
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  )

  if (elapsedSeconds < 60) return '방금'
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}분`
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}시간`
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}일`

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}
