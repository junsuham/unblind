export const boardPresentation: Record<
  string,
  { emoji: string; name: string }
> = {
  prayer: { emoji: '🙏', name: '기도' },
  faith: { emoji: '🕊️', name: '신앙' },
  daily: { emoji: '☀️', name: '일상' },
  church: { emoji: '⛪', name: '교회생활' },
  work: { emoji: '☀️', name: '일상' },
  relationship: { emoji: '💞', name: '연애/결혼' },
}

export function getBoardPresentation(board: string) {
  return boardPresentation[board] ?? { emoji: '💬', name: '게시판' }
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
