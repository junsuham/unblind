'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { UrgentPrayerBadge } from '@/app/components/UrgentPrayerBadge'

export type PrayerSessionPost = {
  id: string
  title: string
  content: string
  urgent: boolean
}

const PRAYER_SECONDS = 60

export default function PrayerSession({
  posts,
}: {
  posts: PrayerSessionPost[]
}) {
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(PRAYER_SECONDS)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [error, setError] = useState('')

  const current = posts[index] ?? null
  const finished = started && index >= posts.length
  const progress = posts.length ? Math.round((index / posts.length) * 100) : 0
  const timerProgress = useMemo(
    () => Math.max(0, Math.round((secondsLeft / PRAYER_SECONDS) * 100)),
    [secondsLeft]
  )

  useEffect(() => {
    if (!started || finished || !current || secondsLeft <= 0) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [current, finished, secondsLeft, started])

  function moveNext() {
    setIndex((value) => value + 1)
    setSecondsLeft(PRAYER_SECONDS)
    setError('')
  }

  async function markPrayed() {
    if (!current || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: current.id, type: 'pray' }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error ?? '기도 기록을 남기지 못했습니다.')
      }
      setCompleted((value) => value + 1)
      moveNext()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '기도 기록을 남기지 못했습니다.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!posts.length) {
    return (
      <section className="rounded-[24px] bg-[var(--ub-surface-card-strong)] px-5 py-12 text-center shadow-[var(--ub-shadow-soft)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
          <SystemIcon name="prayer" size={28} />
        </span>
        <h2 className="mt-4 text-[19px] font-extrabold text-[var(--ub-text-primary)]">지금 모아진 기도 요청이 없어요</h2>
        <p className="mt-2 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
          새로운 요청이 올라오면 이곳에서 차분히 함께 기도할 수 있어요.
        </p>
        <Link href="/board/prayer" className="mt-5 inline-flex min-h-11 items-center font-bold text-[var(--ub-color-brand)]">
          기도 게시판 보기
        </Link>
      </section>
    )
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[26px] bg-[linear-gradient(150deg,var(--ub-surface-card-strong),var(--ub-surface-brand-soft))] p-6 text-center shadow-[var(--ub-shadow-soft)]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-white shadow-lg">
            <SystemIcon name="prayer" size={31} />
          </span>
          <p className="mt-5 text-[11px] font-extrabold tracking-[0.12em] text-[var(--ub-color-brand)]">PRAY TOGETHER</p>
          <h2 className="mt-2 text-[23px] font-extrabold tracking-[-0.6px] text-[var(--ub-text-primary)]">
            5분 함께 기도
          </h2>
          <p className="mt-2 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
            지금 기도가 필요한 익명 요청 {posts.length}개를
            <br />
            한 장씩 천천히 마음에 담아보세요.
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--ub-color-brand)] px-4 text-[15px] font-bold text-white active:scale-[0.99]"
          >
            기도 시작
            <SystemIcon name="play" size={17} filled />
          </button>
        </section>
        <p className="px-4 text-center text-[11px] leading-[17px] text-[var(--ub-text-on-brand-tertiary)]">
          기도한 요청만 기록되며, 누가 기도했는지는 다른 사용자에게 공개되지 않습니다.
        </p>
      </div>
    )
  }

  if (finished) {
    return (
      <section className="rounded-[26px] bg-[var(--ub-surface-card-strong)] px-6 py-12 text-center shadow-[var(--ub-shadow-soft)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
          <SystemIcon name="check" size={31} />
        </span>
        <p className="mt-5 text-[11px] font-extrabold tracking-[0.12em] text-[var(--ub-color-brand)]">PRAYER COMPLETE</p>
        <h2 className="mt-2 text-[22px] font-extrabold text-[var(--ub-text-primary)]">
          함께 기도해주셔서 감사해요
        </h2>
        <p className="mt-2 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
          오늘 {completed}개의 기도 제목에 마음을 보탰어요.
          <br />
          응답 소식이 이어지면 알림으로 전해드릴게요.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link href="/journey" className="flex min-h-12 items-center justify-center rounded-[15px] bg-[var(--ub-surface-muted)] px-3 text-[13px] font-bold text-[var(--ub-text-primary)]">
            나의 여정
          </Link>
          <Link href="/board/prayer" className="flex min-h-12 items-center justify-center rounded-[15px] bg-[var(--ub-color-brand)] px-3 text-[13px] font-bold text-white">
            기도 게시판
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <span className="text-[12px] font-bold text-[var(--ub-text-on-brand-secondary)]">
          {index + 1}/{posts.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ub-surface-card)]">
          <div
            className="h-full rounded-full bg-[var(--ub-color-brand)] transition-[width] duration-300"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
      </div>

      <article className="flex min-h-[440px] flex-col rounded-[26px] bg-[var(--ub-surface-card-strong)] p-5 shadow-[var(--ub-shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {current.urgent && <UrgentPrayerBadge compact />}
            <span className="text-[11px] font-bold text-[var(--ub-text-tertiary)]">익명의 기도 제목</span>
          </div>
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--ub-color-brand) ${timerProgress}%, var(--ub-surface-muted) 0)`,
            }}
            aria-label={`남은 묵상 시간 ${secondsLeft}초`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ub-surface-card-strong)] text-[11px] font-bold text-[var(--ub-text-secondary)]">
              {secondsLeft}
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-[21px] font-extrabold leading-[29px] tracking-[-0.5px] text-[var(--ub-text-primary)]">
          {current.title}
        </h2>
        <p className="mt-4 flex-1 whitespace-pre-wrap text-[15px] leading-[25px] text-[var(--ub-text-secondary)]">
          {current.content}
        </p>

        {error && (
          <p role="alert" className="mb-3 rounded-[12px] bg-[var(--ub-surface-danger-soft)] px-3 py-2 text-[12px] text-[var(--ub-color-danger)]">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={markPrayed}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--ub-color-brand)] px-4 text-[14px] font-bold text-white disabled:opacity-60"
        >
          <SystemIcon name="prayer" size={19} />
          {saving ? '기도 기록 중…' : '기도했어요'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={moveNext}
          className="mt-1 min-h-11 text-[12px] font-semibold text-[var(--ub-text-tertiary)]"
        >
          이번 요청은 건너뛰기
        </button>
      </article>
    </div>
  )
}
