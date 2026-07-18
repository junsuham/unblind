'use client'

import { officialPraiseTracks } from '@/lib/officialPraiseTracks'
import {
  OPEN_PRAISE_PLAYER_EVENT,
  type PraisePlayerTrack,
} from '@/app/components/praisePlayerEvents'

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
      className="flex min-h-[34px] min-w-0 items-center justify-center whitespace-nowrap rounded-[10px] border border-white/12 bg-white/8 px-2 text-[11px] font-semibold leading-none text-white/86 active:bg-white/14 disabled:text-white/45"
    >
      📀 오늘의 찬양
    </button>
  )
}
