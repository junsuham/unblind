'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import type { ChristianShortVideo } from '@/lib/christianShorts'
import styles from './shorts.module.css'

type ChristianShortsFeedProps = {
  videos: ChristianShortVideo[]
  nextPageToken?: string
  message?: string
}

type ShortsPageResponse = {
  videos?: ChristianShortVideo[]
  nextPageToken?: string | null
  error?: string
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

function formatViewCount(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export default function ChristianShortsFeed({
  videos,
  nextPageToken: initialNextPageToken,
  message,
}: ChristianShortsFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const wheelLockedRef = useRef(false)
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const [items, setItems] = useState(videos)
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken)
  const [activeId, setActiveId] = useState<string | null>(videos[0]?.id ?? null)
  const [pageVisible, setPageVisible] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const root = feedRef.current
    if (!root || items.length === 0) return

    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.videoId
          if (id) ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        const mostVisible = [...ratios.entries()]
          .filter(([, ratio]) => ratio >= 0.42)
          .sort((left, right) => right[1] - left[1])[0]

        if (!mostVisible) {
          setActiveId(null)
          return
        }

        setActiveId(mostVisible[0])
      },
      {
        root,
        threshold: [0, 0.25, 0.42, 0.6, 0.8, 1],
      }
    )

    for (const node of cardRefs.current.values()) observer.observe(node)
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    function syncPageVisibility() {
      setPageVisible(!document.hidden)
    }

    syncPageVisibility()
    document.addEventListener('visibilitychange', syncPageVisibility)
    return () => document.removeEventListener('visibilitychange', syncPageVisibility)
  }, [])

  useEffect(() => {
    const root = feedRef.current
    if (!root || items.length < 2) return
    const feedRoot = root

    function moveOneVideo(event: WheelEvent) {
      if (Math.abs(event.deltaY) < 12) return
      event.preventDefault()
      if (wheelLockedRef.current) return

      const currentIndex = Math.max(
        0,
        items.findIndex((video) => video.id === activeId),
      )
      const targetIndex = Math.min(
        items.length - 1,
        Math.max(0, currentIndex + (event.deltaY > 0 ? 1 : -1)),
      )
      const target = cardRefs.current.get(items[targetIndex]?.id)
      if (!target || targetIndex === currentIndex) return

      wheelLockedRef.current = true
      feedRoot.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
      window.setTimeout(() => {
        wheelLockedRef.current = false
      }, 420)
    }

    feedRoot.addEventListener('wheel', moveOneVideo, { passive: false })
    return () => feedRoot.removeEventListener('wheel', moveOneVideo)
  }, [activeId, items])

  const loadMore = useCallback(async () => {
    if (!nextPageToken || loadingRef.current) return

    loadingRef.current = true
    setIsLoadingMore(true)
    setLoadError('')

    try {
      const searchParams = new URLSearchParams({ pageToken: nextPageToken })
      const response = await fetch(`/api/shorts?${searchParams}`, {
        headers: { Accept: 'application/json' },
      })
      const payload = (await response.json()) as ShortsPageResponse
      if (!response.ok) {
        throw new Error(payload.error ?? '다음 영상을 불러오지 못했습니다.')
      }

      setItems((current) => {
        const knownIds = new Set(current.map((video) => video.id))
        const additions = (payload.videos ?? []).filter((video) => {
          if (knownIds.has(video.id)) return false
          knownIds.add(video.id)
          return true
        })
        return [...current, ...additions]
      })
      setNextPageToken(payload.nextPageToken ?? undefined)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : '다음 영상을 불러오지 못했습니다.',
      )
    } finally {
      loadingRef.current = false
      setIsLoadingMore(false)
    }
  }, [nextPageToken])

  useEffect(() => {
    const root = feedRef.current
    const sentinel = loadMoreRef.current
    if (!root || !sentinel || !nextPageToken || isLoadingMore || loadError) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      {
        root,
        rootMargin: '0px 0px 120% 0px',
        threshold: 0,
      },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLoadingMore, loadError, loadMore, nextPageToken])

  if (items.length === 0 && !nextPageToken) {
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
    <div className={styles.feedFrame}>
      <div ref={feedRef} className={styles.feedViewport} aria-label="크리스천 쇼츠 피드">
      {items.map((video, index) => {
        const isActive = activeId === video.id
        const isPlaying = isActive && pageVisible

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
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&mute=1&playsinline=1&rel=0&controls=1`}
                  title={`${video.title} YouTube 재생`}
                  className={styles.player}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className={styles.thumbnailPreview} aria-hidden>
                  <Image
                    src={video.thumbnailUrl}
                    alt=""
                    fill
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 430px) 100vw, 430px"
                    className={styles.thumbnail}
                  />
                  <span className={styles.thumbnailShade} aria-hidden />
                  <span className={styles.duration}>{formatDuration(video.durationSeconds)}</span>
                </div>
              )}
            </div>

            <div className={styles.metadata}>
              <div className={styles.sourceRow}>
                <span className={styles.youtubeBadge}>YouTube</span>
                <span>조회 {formatViewCount(video.viewCount)}</span>
                <span aria-hidden>·</span>
                <span>{index + 1} / {items.length}</span>
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
        <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-hidden />
      </div>

      {(isLoadingMore || loadError || (!nextPageToken && items.length > 0)) && (
        <div className={styles.feedStatus} aria-live="polite">
          {isLoadingMore && <span>다음 영상을 불러오는 중…</span>}
          {!isLoadingMore && loadError && (
            <button type="button" onClick={() => void loadMore()}>
              다시 불러오기
            </button>
          )}
          {!isLoadingMore && !loadError && !nextPageToken && items.length > 0 && (
            <span>새로운 쇼츠를 모두 확인했어요</span>
          )}
        </div>
      )}
    </div>
  )
}
