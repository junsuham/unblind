import Link from 'next/link'
import {
  LOCATION_MENTION_PREFIX,
  PRAISE_MENTION_PREFIX,
  getLocationMapUrl,
  getPraiseMentionLabel,
  type ContentMention,
  type PraiseMentionTrack,
} from '@/lib/praiseMention'
import { Emoji3D } from '@/app/components/ui/Emoji3D'

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

  for (const mention of mentions ?? []) {
    if (mention.type !== 'image') mentionByLabel.set(mention.label, mention)
  }

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
        if (mention.type === 'image') return part

        const className = 'inline rounded-md bg-[var(--ub-surface-brand-soft)] px-1 py-0.5 font-semibold text-[var(--ub-color-brand)] underline decoration-[var(--ub-color-brand)]/35 underline-offset-2'

        return mention.type === 'praise' ? (
          <Link
            key={`${mention.youtubeId}-${index}`}
            href={`/praise?track=${encodeURIComponent(mention.youtubeId)}&title=${encodeURIComponent(mention.title)}&artist=${encodeURIComponent(mention.subtitle)}`}
            className={className}
          >
            <span>{part.slice(0, PRAISE_MENTION_PREFIX.length - 2)}</span>
            <Emoji3D name="disc" size={16} className="mx-0.5 align-[-3px]" />
            <span>{part.slice(PRAISE_MENTION_PREFIX.length)}</span>
          </Link>
        ) : (
          <a key={`${mention.placeId}-${index}`} href={getLocationMapUrl(mention.placeId)} target="_blank" rel="noreferrer" className={className}>
            <span>{part.slice(0, LOCATION_MENTION_PREFIX.length - 3)}</span>
            <Emoji3D name="location" size={16} className="mx-0.5 align-[-3px]" />
            <span>{part.slice(LOCATION_MENTION_PREFIX.length)}</span>
          </a>
        )
      })}
    </>
  )
}
