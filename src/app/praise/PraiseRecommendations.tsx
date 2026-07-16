'use client'

import Image from 'next/image'
import { useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { officialPraiseTracks } from '@/lib/officialPraiseTracks'

export type Song = {
  id: string
  title: string
  artist: string
}

export const songs: Song[] = officialPraiseTracks

export default function PraiseRecommendations({
  initialSongs,
  initialTrackId,
}: {
  initialSongs?: Song[]
  initialTrackId?: string
}) {
  const displayedSongs = initialSongs?.length ? initialSongs : songs
  const [selectedSong, setSelectedSong] = useState(
    displayedSongs.find((song) => song.id === initialTrackId) ?? displayedSongs[0]
  )

  function selectSong(song: Song) {
    setSelectedSong(song)
    window.requestAnimationFrame(() => {
      document.getElementById('unblind-player')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  return (
    <div>
      <section
        id="unblind-player"
        className="sticky top-3 z-20 overflow-hidden rounded-[22px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)]"
      >
        <div className="aspect-video w-full bg-black">
          <iframe
            key={selectedSong.id}
            src={`https://www.youtube-nocookie.com/embed/${selectedSong.id}?autoplay=1&playsinline=1&rel=0`}
            title={`${selectedSong.title} 재생`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-white">
            <SystemIcon name="music" size={18} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">{selectedSong.title}</span>
            <span className="block truncate text-[12px] text-[var(--ub-text-tertiary)]">{selectedSong.artist}</span>
          </span>
        </div>
      </section>

      <div className="mt-5 flex items-end justify-between px-1">
        <div>
          <p className="text-[13px] font-semibold text-[var(--ub-text-on-brand-primary)]">이번 주 TOP 100</p>
          <p className="mt-0.5 text-[11px] text-[var(--ub-text-on-brand-tertiary)]">언블라인드 에디터 선정</p>
        </div>
        <span className="text-[11px] text-[var(--ub-text-on-brand-tertiary)]">곡을 눌러 바로 재생</span>
      </div>

      <section className="mt-2 overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
        {displayedSongs.map((song, index) => {
          const isSelected = selectedSong.id === song.id

          return (
            <button
              key={song.id}
              type="button"
              onClick={() => selectSong(song)}
              aria-label={`${index + 1}위 ${song.title} 재생`}
              className={`flex min-h-[76px] w-full items-center gap-3 border-b border-[var(--ub-separator)] px-3 py-2.5 text-left last:border-b-0 active:bg-[var(--ub-surface-pressed)] ${isSelected ? 'bg-[var(--ub-surface-brand-soft)]' : ''}`}
            >
              <span className={`w-6 shrink-0 text-center text-[14px] tabular-nums ${index < 3 ? 'font-bold text-[var(--ub-color-brand)]' : 'text-[var(--ub-text-secondary)]'}`}>
                {index + 1}
              </span>
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[var(--ub-surface-muted)]">
                <Image
                  src={`https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/22 text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                    <SystemIcon name="play" size={15} className="translate-x-px" />
                  </span>
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[14px] font-semibold ${isSelected ? 'text-[var(--ub-color-brand)]' : ''}`}>
                  {song.title}
                </span>
                <span className="mt-1 block truncate text-[12px] text-[var(--ub-text-tertiary)]">
                  {song.artist}
                </span>
              </span>
              <SystemIcon
                name={isSelected ? 'music' : 'play'}
                size={18}
                className={isSelected ? 'text-[var(--ub-color-brand)]' : 'text-[var(--ub-text-tertiary)]'}
              />
            </button>
          )
        })}
      </section>

      <p className="mt-3 px-1 text-[11px] leading-[17px] text-[var(--ub-text-on-brand-tertiary)]">
        YouTube 공식 플레이어로 재생됩니다. 일부 영상은 권리자의 설정에 따라 재생이 제한될 수 있습니다.
      </p>
    </div>
  )
}
