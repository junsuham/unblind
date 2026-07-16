export const PRAISE_MENTION_PREFIX = '@오・찬・추💿'
export const LOCATION_MENTION_PREFIX = '@지역🏞️'

export type PraiseMentionTrack = {
  youtube_id: string
  title: string
  artist: string
}

export type PraiseContentMention = {
  type: 'praise'
  label: string
  youtubeId: string
  title: string
  subtitle: string
}

export type LocationContentMention = {
  type: 'location'
  label: string
  placeId: string
  name: string
  address: string
}

export type ContentMention = PraiseContentMention | LocationContentMention

export function getActiveMention(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor)
  const start = beforeCursor.lastIndexOf('@')

  if (start < 0) return null

  const fragment = beforeCursor.slice(start)

  if (fragment.includes('\n') || fragment.slice(1).includes('@') || fragment.length > 80) return null

  if (fragment.startsWith(PRAISE_MENTION_PREFIX)) {
    return { start, end: cursor, kind: 'praise' as const, query: fragment.slice(PRAISE_MENTION_PREFIX.length).trim().toLocaleLowerCase('ko-KR') }
  }

  if (fragment.startsWith(LOCATION_MENTION_PREFIX)) {
    return { start, end: cursor, kind: 'location' as const, query: fragment.slice(LOCATION_MENTION_PREFIX.length).trim().toLocaleLowerCase('ko-KR') }
  }

  return { start, end: cursor, kind: 'category' as const, query: fragment.slice(1).trim() }
}

export function getPraiseMentionLabel(title: string) {
  return `${PRAISE_MENTION_PREFIX}${title}`
}

export function getLocationMentionLabel(name: string) {
  return `${LOCATION_MENTION_PREFIX}${name}`
}

export function keepPresentMentions(content: string, mentions: ContentMention[]) {
  const unique = new Map<string, ContentMention>()
  for (const mention of mentions) {
    if (content.includes(mention.label)) unique.set(`${mention.type}:${mention.label}`, mention)
  }
  return Array.from(unique.values()).slice(0, 10)
}

export function getLocationMapUrl(placeId: string) {
  const match = /^(node|way|relation)-(\d+)$/.exec(placeId)
  return match ? `https://www.openstreetmap.org/${match[1]}/${match[2]}` : 'https://www.openstreetmap.org'
}
