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
