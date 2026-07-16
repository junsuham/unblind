export const PRAISE_MENTION_PREFIX = '@오・찬・추💿'

export type PraiseMentionTrack = {
  youtube_id: string
  title: string
  artist: string
}

export function getActivePraiseMention(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor)
  const start = beforeCursor.lastIndexOf('@')

  if (start < 0) return null

  const fragment = beforeCursor.slice(start + 1)

  if (
    fragment.includes('\n') ||
    fragment.includes('@') ||
    fragment.startsWith('오・찬・추💿') ||
    fragment.length > 40
  ) return null

  return {
    start,
    end: cursor,
    query: fragment
      .replace(/^\+\s*/, '')
      .trim()
      .toLocaleLowerCase('ko-KR'),
  }
}

export function getPraiseMentionLabel(title: string) {
  return `${PRAISE_MENTION_PREFIX}${title}`
}
