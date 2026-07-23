'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  SystemIcon,
  type SystemIconName,
} from '@/app/components/ui/SystemIcon'
import { officialPraiseTracks } from '@/lib/officialPraiseTracks'
import {
  getPraiseSituation,
  getSituationSongs,
  praiseSituations,
  type PraiseSituationKey,
} from '@/lib/praiseSituations'

export type Song = {
  id: string
  title: string
  artist: string
}

export const songs: Song[] = officialPraiseTracks

const situationIcons: Record<PraiseSituationKey, SystemIconName> = {
  all: 'disc',
  weary: 'leaf',
  decision: 'sparkles',
  restoration: 'heart',
  community: 'prayer',
}

export default function PraiseRecommendations({
  initialSongs,
  initialTrackId,
  initialMentionSong,
}: {
  initialSongs?: Song[]
  initialTrackId?: string
  initialMentionSong?: Song
}) {
  const displayedSongs = initialSongs?.length ? initialSongs : songs
  const [selectedSituation, setSelectedSituation] = useState<PraiseSituationKey>('all')
  const [selectedSong, setSelectedSong] = useState(
    displayedSongs.find((song) => song.id === initialTrackId) ??
      (initialMentionSong?.id === initialTrackId ? initialMentionSong : undefined) ??
      displayedSongs[0]
  )
  const filteredSongs = useMemo(
    () => getSituationSongs(displayedSongs, selectedSituation),
    [displayedSongs, selectedSituation],
  )
  const situation = getPraiseSituation(selectedSituation)

  function selectSong(song: Song) {
    setSelectedSong(song)
    window.requestAnimationFrame(() => {
      document.getElementById('unblind-player')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  function selectSituation(key: PraiseSituationKey) {
    const nextSongs = getSituationSongs(displayedSongs, key)
    setSelectedSituation(key)
    if (nextSongs[0]) setSelectedSong(nextSongs[0])
  }

  return (
    <div>
      <section aria-labelledby="praise-situation-title" className="mb-5">
        <div className="mb-2 px-1">
          <h2 id="praise-situation-title" className="text-[14px] font-bold text-[var(--ub-text-on-brand-primary)]">지금 마음에 필요한 찬양</h2>
          <p className="mt-0.5 text-[11px] text-[var(--ub-text-on-brand-tertiary)]">상황을 선택하면 어울리는 찬양부터 바로 재생됩니다.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {praiseSituations.filter((item) => item.key !== 'all').map((item) => {
            const isSelected = selectedSituation === item.key

            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectSituation(item.key)}
                className={isSelected
                  ? 'min-h-[82px] rounded-[18px] bg-[var(--ub-surface-card-strong)] p-3 text-left text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] ring-2 ring-[var(--ub-color-brand)]'
                  : 'min-h-[82px] rounded-[18px] bg-[var(--ub-surface-card)] p-3 text-left text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)] active:bg-[var(--ub-surface-pressed)]'}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
                  <SystemIcon name={situationIcons[item.key]} size={17} filled={isSelected} />
                </span>
                <span className="mt-2 block text-[13px] font-bold tracking-[-0.2px]">{item.label}</span>
                <span className="mt-0.5 line-clamp-1 block text-[11px] text-[var(--ub-text-secondary)]">{item.description}</span>
              </button>
            )
          })}
        </div>
        {selectedSituation !== 'all' && (
          <button
            type="button"
            onClick={() => selectSituation('all')}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--ub-surface-card)] text-[12px] font-semibold text-[var(--ub-text-on-brand-primary)] active:bg-[var(--ub-surface-pressed)]"
          >
            <SystemIcon name="disc" size={16} />
            오・찬・추 전체 보기
          </button>
        )}
      </section>

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
          <span className="ml-auto shrink-0 rounded-full bg-[var(--ub-surface-brand-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--ub-color-brand)]">
            {situation.label}
          </span>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
        <div className="border-b border-[var(--ub-separator)] px-4 py-3">
          <p className="text-[13px] font-bold">{situation.label}</p>
          <p className="mt-0.5 text-[11px] text-[var(--ub-text-tertiary)]">추천 {filteredSongs.length}곡</p>
        </div>
        {filteredSongs.map((song, index) => {
          const isSelected = selectedSong.id === song.id

          return (
            <button
              key={song.id}
              type="button"
              onClick={() => selectSong(song)}
              aria-label={`${index + 1}번 ${song.title} 재생`}
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

    </div>
  )
}
