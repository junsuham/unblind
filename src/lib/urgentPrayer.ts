export const URGENT_PRAYER_TAG = '긴급중보'

export function isUrgentPrayerPost(board: string, tags: unknown) {
  return board === 'prayer' && Array.isArray(tags) && tags.includes(URGENT_PRAYER_TAG)
}

export function getVisiblePostTags(tags: unknown) {
  if (!Array.isArray(tags)) return []

  return tags.filter(
    (tag): tag is string => typeof tag === 'string' && tag !== URGENT_PRAYER_TAG
  )
}

export function parsePostTags(value: unknown) {
  if (!Array.isArray(value)) return []

  const tags = value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim().replace(/^#/, '').slice(0, 24))
    .filter((tag) => Boolean(tag) && tag !== URGENT_PRAYER_TAG)

  return Array.from(new Set(tags)).slice(0, 5)
}
