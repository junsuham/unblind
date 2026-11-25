'use client'

import { useId } from 'react'
import { officialPraiseTracks } from '@/lib/officialPraiseTracks'
import {
  OPEN_PRAISE_PLAYER_EVENT,
  type PraisePlayerTrack,
} from '@/app/components/praisePlayerEvents'
import { HomeAppTileContent, homeAppTileClassName } from '@/app/components/HomeAppTile'

type HomePraisePlayerProps = {
  initialTracks: PraisePlayerTrack[]
}

export function HomePraisePlayer({ initialTracks }: HomePraisePlayerProps) {
  const descriptionId = useId()
  const playlist = initialTracks.length
    ? initialTracks
    : officialPraiseTracks.slice(0, 10)

  return (
    <button
      type="button"
      aria-label="오늘의 찬양"
      aria-describedby={descriptionId}
      disabled={!playlist.length}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(OPEN_PRAISE_PLAYER_EVENT, {
          detail: { tracks: playlist },
        }))
      }}
      className={homeAppTileClassName}
    >
      <HomeAppTileContent label="오늘의 찬양" tone="amber" />
      <span id={descriptionId} className="sr-only">바로 재생 · 상황별 추천 제공</span>
    </button>
  )
}
