import Link from 'next/link'
import {
  getPraiseMentionLabel,
  type PraiseMentionTrack,
} from '@/lib/praiseMention'

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function PraiseMentionText({
  content,
  tracks,
}: {
  content: string
  tracks: PraiseMentionTrack[]
}) {
  const labelToTrack = new Map(
    tracks.map((track) => [getPraiseMentionLabel(track.title), track])
  )
  const labels = Array.from(labelToTrack.keys()).sort(
    (left, right) => right.length - left.length
  )

  if (!labels.length) return <>{content}</>

  const pattern = new RegExp(`(${labels.map(escapePattern).join('|')})`, 'g')

  return (
    <>
      {content.split(pattern).map((part, index) => {
        const track = labelToTrack.get(part)

        if (!track) return part

        return (
          <Link
            key={`${track.youtube_id}-${index}`}
            href={`/praise?track=${encodeURIComponent(track.youtube_id)}`}
            className="inline rounded-md bg-[var(--ub-surface-brand-soft)] px-1 py-0.5 font-semibold text-[var(--ub-color-brand)] underline decoration-[var(--ub-color-brand)]/35 underline-offset-2"
          >
            {part}
          </Link>
        )
      })}
    </>
  )
}
