'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  faithMoodOptions,
  faithWeatherOptions,
  type FaithMood,
  type FaithWeather,
} from '@/lib/dailyFaith'
import { SystemIcon } from './ui/SystemIcon'

type CheckinResult = {
  mood: FaithMood
  faith_weather: FaithWeather
  checkin_date: string
}

const moodGuides: Record<FaithMood, {
  title: string
  description: string
  verse?: string
  reference?: string
  actions: Array<{ label: string; href: string }>
}> = {
  peaceful: {
    title: '이 평안을 오래 기억해요',
    description: '오늘의 평안을 짧은 감사로 남겨보세요.',
    actions: [{ label: '감사 한 줄 남기기', href: '/gratitude' }],
  },
  grateful: {
    title: '감사를 기록할 좋은 날이에요',
    description: '오늘 받은 은혜를 한 줄로 남기면 한 달의 감사가 됩니다.',
    actions: [{ label: '감사일기 쓰기', href: '/gratitude' }],
  },
  tired: {
    title: '잠시 쉬어가도 괜찮아요',
    description: '말보다 찬양이 필요한 날, 위로가 되는 곡을 바로 들어보세요.',
    actions: [{ label: '위로 찬양 듣기', href: '/praise' }],
  },
  anxious: {
    title: '염려를 혼자 붙들지 마세요',
    description: '말씀을 천천히 읽고, 필요하면 익명으로 함께 기도를 요청해보세요.',
    verse: '아무 것도 염려하지 말고 오직 모든 일에 기도와 간구로 하나님께 아뢰라.',
    reference: '빌립보서 4:6',
    actions: [
      { label: '기도 요청하기', href: '/post/new?board=prayer' },
      { label: '기도 게시판 보기', href: '/board/prayer' },
    ],
  },
  lonely: {
    title: '오늘도 혼자가 아니에요',
    description: '익명의 기도 친구를 만나거나 공동체의 기도 제목 곁에 머물러보세요.',
    actions: [
      { label: '마니또 만나기', href: '/manitto' },
      { label: '익명 기도방 가기', href: '/board/prayer' },
    ],
  },
}

export function DailyFaithCheckIn() {
  const [checkin, setCheckin] = useState<CheckinResult | null>(null)
  const [mood, setMood] = useState<FaithMood | null>(null)
  const [weather, setWeather] = useState<FaithWeather | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    fetch('/api/faith-checkin')
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (alive && result?.checkin) setCheckin(result.checkin)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const selectedMood = useMemo(
    () => faithMoodOptions.find((option) => option.value === (checkin?.mood ?? mood)),
    [checkin?.mood, mood]
  )
  const selectedWeather = useMemo(
    () => faithWeatherOptions.find((option) => option.value === (checkin?.faith_weather ?? weather)),
    [checkin?.faith_weather, weather]
  )
  const guide = checkin ? moodGuides[checkin.mood] : null

  async function saveCheckin() {
    if (!mood || !weather || saving) return
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/faith-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, faithWeather: weather }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '체크인을 저장하지 못했습니다.')
      setCheckin(result.checkin)
      setGuideOpen(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '체크인을 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="mb-4" aria-labelledby="daily-faith-checkin-title">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <p id="daily-faith-checkin-title" className="text-[12px] font-bold tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">오늘의 신앙 체크인</p>
          {checkin && <span className="text-[11px] font-semibold text-[var(--ub-text-on-brand-tertiary)]">오늘 완료</span>}
        </div>

        <div className="rounded-[20px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card-strong)] p-4 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
          {loading ? (
            <div className="h-[104px] animate-pulse rounded-[14px] bg-[var(--ub-surface-muted)]" aria-hidden />
          ) : checkin ? (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex min-h-[58px] w-full items-center gap-3 text-left"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[var(--ub-surface-brand-soft)] text-[26px]" aria-hidden>
                {selectedMood?.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[15px]">마음은 {selectedMood?.label}</strong>
                <span className="mt-0.5 block text-[12px] text-[var(--ub-text-secondary)]">
                  신앙 날씨 {selectedWeather?.emoji} {selectedWeather?.label} · 맞춤 안내 다시 보기
                </span>
              </span>
              <span className="text-[22px] text-[var(--ub-text-tertiary)]" aria-hidden>›</span>
            </button>
          ) : (
            <>
              <p className="text-[14px] font-extrabold">오늘 마음은 어떤가요?</p>
              <div className="mt-2.5 grid grid-cols-5 gap-1.5" aria-label="오늘의 마음">
                {faithMoodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={mood === option.value}
                    onClick={() => setMood(option.value)}
                    className={`min-w-0 rounded-[13px] px-1 py-2 text-center ${
                      mood === option.value
                        ? 'bg-[var(--ub-color-brand)] text-white'
                        : 'bg-[var(--ub-surface-muted)] text-[var(--ub-text-secondary)]'
                    }`}
                  >
                    <span className="block text-[20px]" aria-hidden>{option.emoji}</span>
                    <span className="mt-0.5 block text-[10px] font-bold">{option.label}</span>
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[14px] font-extrabold">신앙의 날씨는요?</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5" aria-label="오늘의 신앙 날씨">
                {faithWeatherOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={weather === option.value}
                    onClick={() => setWeather(option.value)}
                    className={`rounded-[13px] px-1 py-2 ${
                      weather === option.value
                        ? 'bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)] ring-1 ring-[var(--ub-color-brand)]'
                        : 'bg-[var(--ub-surface-muted)] text-[var(--ub-text-secondary)]'
                    }`}
                  >
                    <span className="block text-[22px]" aria-hidden>{option.emoji}</span>
                    <span className="mt-0.5 block text-[10px] font-bold">{option.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={saveCheckin}
                disabled={!mood || !weather || saving}
                className="mt-3 min-h-11 w-full rounded-[13px] bg-[var(--ub-color-brand)] px-4 text-[13px] font-bold text-white disabled:opacity-35"
              >
                {saving ? '기록 중…' : '오늘 체크인 남기기'}
              </button>
              {error && <p className="mt-2 text-[12px] text-[var(--ub-danger-text)]" role="alert">{error}</p>}
            </>
          )}
        </div>
      </section>

      {guideOpen && guide && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-3 pb-[calc(12px+env(safe-area-inset-bottom))]" role="presentation" onClick={() => setGuideOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="faith-guide-title"
            className="w-full max-w-[430px] rounded-[26px] bg-[var(--ub-surface-card-strong)] p-5 text-[var(--ub-text-primary)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.08em] text-[var(--ub-color-brand)]">TODAY&apos;S GUIDE</p>
                <h2 id="faith-guide-title" className="mt-1 text-[21px] font-extrabold tracking-[-0.4px]">{guide.title}</h2>
              </div>
              <button type="button" onClick={() => setGuideOpen(false)} aria-label="안내 닫기" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ub-surface-muted)] text-[var(--ub-text-secondary)]">
                <SystemIcon name="close" size={18} />
              </button>
            </div>
            <p className="mt-2 text-[14px] leading-[21px] text-[var(--ub-text-secondary)]">{guide.description}</p>
            {guide.verse && (
              <blockquote className="mt-4 rounded-[16px] bg-[var(--ub-surface-muted)] p-4">
                <p className="text-[14px] font-semibold leading-[22px]">“{guide.verse}”</p>
                <footer className="mt-2 text-right text-[11px] text-[var(--ub-text-tertiary)]">{guide.reference}</footer>
              </blockquote>
            )}
            <div className="mt-4 grid gap-2">
              {guide.actions.map((action, index) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={() => setGuideOpen(false)}
                  className={`flex min-h-12 items-center justify-center rounded-[14px] px-4 text-[14px] font-bold ${
                    index === 0
                      ? 'bg-[var(--ub-color-brand)] text-white'
                      : 'bg-[var(--ub-surface-muted)] text-[var(--ub-color-brand)]'
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
