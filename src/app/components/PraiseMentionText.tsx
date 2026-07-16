import Link from 'next/link'
import {
  getLocationMapUrl,
  getPraiseMentionLabel,
  type ContentMention,
  type PraiseMentionTrack,
} from '@/lib/praiseMention'

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function PraiseMentionText({
  content,
  mentions = [],
  tracks = [],
}: {
  content: string
  mentions?: ContentMention[] | null
  tracks?: PraiseMentionTrack[]
}) {
  const mentionByLabel = new Map<string, ContentMention>()

  for (const track of tracks) {
    const label = getPraiseMentionLabel(track.title)
    mentionByLabel.set(label, {
      type: 'praise',
      label,
      youtubeId: track.youtube_id,
      title: track.title,
      subtitle: track.artist,
    })
  }

  for (const mention of mentions ?? []) mentionByLabel.set(mention.label, mention)

  const labels = Array.from(mentionByLabel.keys())
    .filter((label) => content.includes(label))
    .sort((left, right) => right.length - left.length)

  if (!labels.length) return <>{content}</>

  const pattern = new RegExp(`(${labels.map(escapePattern).join('|')})`, 'g')

  return (
    <>
      {content.split(pattern).map((part, index) => {
        const mention = mentionByLabel.get(part)
        if (!mention) return part

        const className = 'inline rounded-md bg-[var(--ub-surface-brand-soft)] px-1 py-0.5 font-semibold text-[var(--ub-color-brand)] underline decoration-[var(--ub-color-brand)]/35 underline-offset-2'

        return mention.type === 'praise' ? (
          <Link
            key={`${mention.youtubeId}-${index}`}
            href={`/praise?track=${encodeURIComponent(mention.youtubeId)}&title=${encodeURIComponent(mention.title)}&artist=${encodeURIComponent(mention.subtitle)}`}
            className={className}
          >
            {part}
          </Link>
        ) : (
          <a key={`${mention.placeId}-${index}`} href={getLocationMapUrl(mention.placeId)} target="_blank" rel="noreferrer" className={className}>{part}</a>
        )
      })}
    </>
  )
}
