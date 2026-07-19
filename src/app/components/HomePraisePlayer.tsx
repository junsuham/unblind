'use client'

import { officialPraiseTracks } from '@/lib/officialPraiseTracks'
import {
  OPEN_PRAISE_PLAYER_EVENT,
  type PraisePlayerTrack,
} from '@/app/components/praisePlayerEvents'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type HomePraisePlayerProps = {
  initialTracks: PraisePlayerTrack[]
}

export function HomePraisePlayer({ initialTracks }: HomePraisePlayerProps) {
  const playlist = initialTracks.length
    ? initialTracks
    : officialPraiseTracks.slice(0, 10)

  return (
    <button
      type="button"
      disabled={!playlist.length}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(OPEN_PRAISE_PLAYER_EVENT, {
          detail: { tracks: playlist },
        }))
      }}
      className="flex min-h-[68px] w-full items-center gap-3 border-t border-[var(--ub-separator)] px-4 py-3 text-left text-[var(--ub-text-primary)] active:bg-[var(--ub-surface-pressed)] disabled:opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
        <SystemIcon name="disc" size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold tracking-[-0.2px]">오늘의 찬양</span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--ub-text-secondary)]">
          바로 재생 · 상황별 추천 제공
        </span>
      </span>
      <span className="text-[22px] leading-none text-[var(--ub-text-tertiary)]" aria-hidden>›</span>
    </button>
  )
}
