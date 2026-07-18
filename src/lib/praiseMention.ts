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

export type ImageContentMention = {
  type: 'image'
  label: ''
  storagePath: string
  fileName: string
  mimeType: string
  size: number
}

export type ContentMention = PraiseContentMention | LocationContentMention | ImageContentMention

export type ActiveMention = {
  start: number
  end: number
  kind: 'category' | 'praise' | 'location'
  query: string
}

export function getActiveMention(value: string, cursor: number): ActiveMention | null {
  const beforeCursor = value.slice(0, cursor)
  const start = beforeCursor.lastIndexOf('@')

  if (start < 0) return null

  const fragment = beforeCursor.slice(start)

  if (fragment.includes('\n') || fragment.slice(1).includes('@') || fragment.length > 80) {
    return null
  }

  if (fragment.startsWith(PRAISE_MENTION_PREFIX)) {
    return {
      start,
      end: cursor,
      kind: 'praise',
      query: fragment.slice(PRAISE_MENTION_PREFIX.length).trim().toLocaleLowerCase('ko-KR'),
    }
  }

  if (fragment.startsWith(LOCATION_MENTION_PREFIX)) {
    return {
      start,
      end: cursor,
      kind: 'location',
      query: fragment.slice(LOCATION_MENTION_PREFIX.length).trim().toLocaleLowerCase('ko-KR'),
    }
  }

  return { start, end: cursor, kind: 'category', query: fragment.slice(1).trim() }
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
    if (mention.type === 'image') {
      unique.set(`image:${mention.storagePath}`, mention)
      continue
    }

    if (content.includes(mention.label)) unique.set(`${mention.type}:${mention.label}`, mention)
  }

  return Array.from(unique.values()).slice(0, 10)
}

export function getLocationMapUrl(placeId: string) {
  const match = /^(node|way|relation)-(\d+)$/.exec(placeId)
  return match ? `https://www.openstreetmap.org/${match[1]}/${match[2]}` : 'https://www.openstreetmap.org'
}
