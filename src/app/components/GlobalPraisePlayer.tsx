'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import {
  OPEN_PRAISE_PLAYER_EVENT,
  type OpenPraisePlayerDetail,
  type PraisePlayerTrack,
} from '@/app/components/praisePlayerEvents'

function formatPlaybackTime(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
  const minutes = Math.floor(safeValue / 60)
  const seconds = safeValue % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function GlobalPraisePlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [tracks, setTracks] = useState<PraisePlayerTrack[]>([])
  const [trackIndex, setTrackIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(180)
  const selectedTrack = tracks[trackIndex]
  const praisePageHref = selectedTrack
    ? `/praise?track=${encodeURIComponent(selectedTrack.id)}&title=${encodeURIComponent(selectedTrack.title)}&artist=${encodeURIComponent(selectedTrack.artist)}`
    : '/praise'

  const sendPlayerCommand = useCallback((func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    )
  }, [])

  const closePlayer = useCallback(() => {
    sendPlayerCommand('pauseVideo')
    setPlaying(false)
    setOpen(false)
  }, [sendPlayerCommand])

  function togglePlayback() {
    const nextPlaying = !playing
    sendPlayerCommand(nextPlaying ? 'playVideo' : 'pauseVideo')
    setPlaying(nextPlaying)
  }

  function selectRelativeTrack(offset: number) {
    setTrackIndex((current) => (
      (current + offset + tracks.length) % tracks.length
    ))
    setCurrentTime(0)
    setDuration(180)
    setPlaying(true)
  }

  useEffect(() => {
    function handleOpenPlayer(event: Event) {
      const detail = (event as CustomEvent<OpenPraisePlayerDetail>).detail
      if (!detail?.tracks?.length) return

      setTracks(detail.tracks)
      setTrackIndex(0)
      setCurrentTime(0)
      setDuration(180)
      setPlaying(true)
      setExpanded(true)
      setOpen(true)
    }

    window.addEventListener(OPEN_PRAISE_PLAYER_EVENT, handleOpenPlayer)
    return () => {
      window.removeEventListener(OPEN_PRAISE_PLAYER_EVENT, handleOpenPlayer)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    function handlePlayerMessage(event: MessageEvent) {
      if (!event.origin.includes('youtube')) return

      let payload: {
        event?: string
        info?: {
          currentTime?: number
          duration?: number
          playerState?: number
        }
      }

      try {
        payload = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data
      } catch {
        return
      }

      if (payload?.event !== 'infoDelivery' || !payload.info) return
      if (typeof payload.info.currentTime === 'number') {
        setCurrentTime(payload.info.currentTime)
      }
      if (typeof payload.info.duration === 'number' && payload.info.duration > 0) {
        setDuration(payload.info.duration)
      }
      if (typeof payload.info.playerState === 'number') {
        setPlaying(payload.info.playerState === 1)
      }
    }

    const progressTimer = window.setInterval(() => {
      sendPlayerCommand('getCurrentTime')
      sendPlayerCommand('getDuration')
    }, 750)

    window.addEventListener('message', handlePlayerMessage)
    return () => {
      window.clearInterval(progressTimer)
      window.removeEventListener('message', handlePlayerMessage)
    }
  }, [open, selectedTrack?.id, sendPlayerCommand])

  if (!open || !selectedTrack) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+6px)] z-[80] flex justify-center px-3">
      {expanded ? (
        <section
          role="dialog"
          aria-label="재생 중인 찬양"
          className="ub-player-card pointer-events-auto relative w-full max-w-[390px] overflow-hidden rounded-[34px] border border-white/10 bg-black/95 px-4 pb-3.5 pt-3.5 text-white shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3 pr-[62px]">
            <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[13px] bg-white/10">
              <Image
                src={`https://i.ytimg.com/vi/${selectedTrack.id}/mqdefault.jpg`}
                alt=""
                fill
                sizes="58px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold tracking-[-0.3px]">
                {selectedTrack.title}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-white/58">
                {selectedTrack.artist}
              </p>
            </div>
            <span className="flex h-7 shrink-0 items-center gap-[2px] text-[#d38aaf]" aria-hidden>
              {[8, 15, 22, 12, 18, 10].map((height, index) => (
                <span key={`${height}-${index}`} className="w-[2px] rounded-full bg-current" style={{ height }} />
              ))}
            </span>
          </div>

          <div className="absolute right-3 top-3 flex gap-1">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="플레이어 축소"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[16px] text-white/70 active:bg-white/20"
            >
              −
            </button>
            <button
              type="button"
              onClick={closePlayer}
              aria-label="플레이어 닫기"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 active:bg-white/20"
            >
              <SystemIcon name="close" size={15} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[36px_1fr_40px] items-center gap-2 text-[10px] font-medium tabular-nums text-white/55">
            <span>{formatPlaybackTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={Math.max(duration, 1)}
              step="1"
              value={Math.min(currentTime, duration)}
              aria-label="재생 위치"
              onChange={(event) => {
                const nextTime = Number(event.target.value)
                setCurrentTime(nextTime)
                sendPlayerCommand('seekTo', [nextTime, true])
              }}
              className="ub-player-range ub-player-range-dark h-6 w-full cursor-pointer"
            />
            <span className="text-right">−{formatPlaybackTime(duration - currentTime)}</span>
          </div>

          <div className="mt-1 grid grid-cols-[34px_1fr_54px_1fr] items-center gap-2 pr-7">
            <Link
              href={praisePageHref}
              onClick={() => setExpanded(false)}
              aria-label="오・찬・추 페이지로 이동"
              title="오・찬・추 페이지"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 active:bg-white/10 active:text-white"
            >
              <SystemIcon name="disc" size={21} />
            </Link>
            <button
              type="button"
              onClick={() => selectRelativeTrack(-1)}
              aria-label="이전 찬양"
              className="mx-auto flex h-9 w-14 items-center justify-center rounded-full active:bg-white/10"
            >
              <SystemIcon name="previous" size={27} filled />
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? '일시정지' : '재생'}
              className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-white text-black active:scale-95"
            >
              <SystemIcon name={playing ? 'pause' : 'play'} size={28} filled={!playing} />
            </button>
            <button
              type="button"
              onClick={() => selectRelativeTrack(1)}
              aria-label="다음 찬양"
              className="mx-auto flex h-9 w-14 items-center justify-center rounded-full active:bg-white/10"
            >
              <SystemIcon name="next" size={27} filled />
            </button>
          </div>

          <SystemIcon name="speaker" size={21} className="absolute bottom-[27px] right-4 text-white/62" />
        </section>
      ) : (
        <section className="ub-player-card pointer-events-auto flex h-[48px] w-full max-w-[280px] items-center gap-2 rounded-full border border-white/10 bg-black/95 p-1.5 pr-2 text-white shadow-[0_14px_40px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="찬양 플레이어 펼치기"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
              <Image
                src={`https://i.ytimg.com/vi/${selectedTrack.id}/mqdefault.jpg`}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold">{selectedTrack.title}</span>
              <span className="block truncate text-[10px] text-white/55">{selectedTrack.artist}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={playing ? '일시정지' : '재생'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black"
          >
            <SystemIcon name={playing ? 'pause' : 'play'} size={20} filled={!playing} />
          </button>
          <Link
            href={praisePageHref}
            onClick={() => setExpanded(false)}
            aria-label="오・찬・추 페이지로 이동"
            title="오・찬・추 페이지"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 active:bg-white/10"
          >
            <SystemIcon name="disc" size={17} />
          </Link>
          <button
            type="button"
            onClick={closePlayer}
            aria-label="플레이어 닫기"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 active:bg-white/10"
          >
            <SystemIcon name="close" size={15} />
          </button>
        </section>
      )}

      <iframe
        ref={iframeRef}
        key={selectedTrack.id}
        src={`https://www.youtube-nocookie.com/embed/${selectedTrack.id}?autoplay=1&playsinline=1&rel=0&controls=0&enablejsapi=1`}
        title={`${selectedTrack.title} 재생`}
        className="pointer-events-none absolute h-px w-px opacity-0"
        allow="autoplay; encrypted-media"
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'listening', id: 'unblind-global-player' }),
            '*'
          )
          sendPlayerCommand('playVideo')
        }}
      />
    </div>
  )
}
