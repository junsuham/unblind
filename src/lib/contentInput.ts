import type { ContentMention } from '@/lib/praiseMention'

const boards = new Set(['prayer', 'faith', 'daily'])

export function parseBoard(value: unknown) {
  return typeof value === 'string' && boards.has(value) ? value : null
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function parseContentMentions(value: unknown, userId: string): ContentMention[] | null {
  if (!Array.isArray(value) || value.length > 10) return value == null ? [] : null

  const mentions: ContentMention[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const mention = item as Record<string, unknown>

    if (mention.type === 'praise') {
      const youtubeId = safeText(mention.youtubeId, 20)
      const title = safeText(mention.title, 120)
      const subtitle = safeText(mention.subtitle, 120)
      const label = safeText(mention.label, 180)
      if (!/^[A-Za-z0-9_-]{6,20}$/.test(youtubeId) || !title || !label) return null
      mentions.push({ type: 'praise', youtubeId, title, subtitle, label })
      continue
    }

    if (mention.type === 'location') {
      const placeId = safeText(mention.placeId, 80)
      const name = safeText(mention.name, 120)
      const address = safeText(mention.address, 240)
      const label = safeText(mention.label, 180)
      if (!placeId || !name || !label) return null
      mentions.push({ type: 'location', placeId, name, address, label })
      continue
    }

    if (mention.type === 'image') {
      const storagePath = safeText(mention.storagePath, 260)
      const fileName = safeText(mention.fileName, 160)
      const mimeType = safeText(mention.mimeType, 40)
      const size = typeof mention.size === 'number' ? mention.size : 0
      if (!storagePath.startsWith(`${userId}/`) || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) || size <= 0 || size > 5 * 1024 * 1024) return null
      mentions.push({ type: 'image', label: '', storagePath, fileName, mimeType, size })
      continue
    }

    return null
  }

  return mentions
}
