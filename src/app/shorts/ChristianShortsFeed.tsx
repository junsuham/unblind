'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import type { ChristianShortVideo } from '@/lib/christianShorts'
import styles from './shorts.module.css'

type ChristianShortsFeedProps = {
  videos: ChristianShortVideo[]
  message?: string
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatPublishedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

export default function ChristianShortsFeed({
  videos,
  message,
}: ChristianShortsFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const [activeId, setActiveId] = useState(videos[0]?.id ?? null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    const root = feedRef.current
    if (!root || videos.length === 0) return

    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.videoId
          if (id) ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        const mostVisible = [...ratios.entries()]
          .filter(([, ratio]) => ratio >= 0.55)
          .sort((left, right) => right[1] - left[1])[0]

        if (!mostVisible) {
          setPlayingId(null)
          return
        }

        const nextId = mostVisible[0]
        setActiveId(nextId)
        setPlayingId((current) => current === nextId ? current : null)
      },
      {
        root,
        threshold: [0, 0.35, 0.55, 0.7, 1],
      }
    )

    for (const node of cardRefs.current.values()) observer.observe(node)
    return () => observer.disconnect()
  }, [videos])

  useEffect(() => {
    function stopHiddenPlayback() {
      if (document.hidden) setPlayingId(null)
    }

    document.addEventListener('visibilitychange', stopHiddenPlayback)
    return () => document.removeEventListener('visibilitychange', stopHiddenPlayback)
  }, [])

  if (videos.length === 0) {
    return (
      <section className={styles.emptyState} aria-live="polite">
        <span className={styles.emptyIcon}>
          <SystemIcon name="play" size={24} />
        </span>
        <h1>아직 표시할 쇼츠가 없어요</h1>
        <p>{message ?? '필터 조건을 통과한 새 영상을 확인 중입니다.'}</p>
        <a
          href="https://www.youtube.com/results?search_query=%EA%B8%B0%EB%8F%85%EA%B5%90+shorts"
          target="_blank"
          rel="noopener noreferrer"
        >
          YouTube에서 확인
          <SystemIcon name="external" size={15} />
        </a>
      </section>
    )
  }

  return (
    <div ref={feedRef} className={styles.feedViewport} aria-label="크리스천 쇼츠 피드">
      {videos.map((video, index) => {
        const isActive = activeId === video.id
        const isPlaying = playingId === video.id && isActive

        return (
          <article
            key={video.id}
            ref={(node) => {
              if (node) cardRefs.current.set(video.id, node)
              else cardRefs.current.delete(video.id)
            }}
            data-video-id={video.id}
            className={styles.shortCard}
            aria-label={`${index + 1}번 영상 ${video.title}`}
          >
            <div className={styles.playerStage}>
              {isPlaying ? (
                <iframe
                  key={video.id}
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0&controls=1`}
                  title={`${video.title} YouTube 재생`}
                  className={styles.player}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className={styles.thumbnailButton}
                  onClick={() => setPlayingId(video.id)}
                  aria-label={`${video.title} 재생`}
                >
                  <Image
                    src={video.thumbnailUrl}
                    alt=""
                    fill
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 430px) 100vw, 430px"
                    className={styles.thumbnail}
                  />
                  <span className={styles.thumbnailShade} aria-hidden />
                  <span className={styles.playButton} aria-hidden>
                    <SystemIcon name="play" size={25} filled />
                  </span>
                  <span className={styles.duration}>{formatDuration(video.durationSeconds)}</span>
                </button>
              )}
            </div>

            <div className={styles.metadata}>
              <div className={styles.sourceRow}>
                <span className={styles.youtubeBadge}>YouTube</span>
                <span>{index + 1} / {videos.length}</span>
                {formatPublishedAt(video.publishedAt) && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={video.publishedAt}>{formatPublishedAt(video.publishedAt)}</time>
                  </>
                )}
              </div>

              <h2>{video.title}</h2>
              <p className={styles.channel}>{video.channelTitle}</p>

              <div className={styles.tagRow} aria-label="영상 필터 태그">
                {video.matchedTags.map((tag) => <span key={tag}>{tag}</span>)}
                <span>#Shorts</span>
              </div>

              <div className={styles.actionRow}>
                <a
                  href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube에서 보기
                  <SystemIcon name="external" size={15} />
                </a>
                <span className={styles.swipeHint}>
                  <SystemIcon name="next" size={15} />
                  위로 밀어 다음 영상
                </span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
