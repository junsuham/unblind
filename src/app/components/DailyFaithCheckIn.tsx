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
import { Emoji3D } from './ui/Emoji3D'
import { FaithAvatar } from './FaithAvatar'
import { FaithWeatherIcon } from './FaithWeatherIcon'

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

export function DailyFaithCheckIn({ storageScope, characterName }: { storageScope: string; characterName: string }) {
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
      .catch(() => {
        if (alive) setError('체크인 상태를 확인하지 못했어요. 연결 상태를 확인해주세요.')
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
      <section className="ub-liquid-card mb-4 p-4 text-[var(--ub-text-primary)]" aria-label="마음과 신앙 기록">
        <FaithAvatar key={storageScope} mood={checkin?.mood ?? mood} weather={checkin?.faith_weather ?? weather} storageScope={storageScope} characterName={characterName} />
        <div aria-busy={loading}>
          {loading ? (
            <div className="mt-3 h-[50px] animate-pulse rounded-[13px] bg-[var(--ub-surface-muted)]" aria-hidden />
          ) : checkin ? (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              aria-label={`오늘 마음 ${selectedMood?.label ?? ''}, 신앙 날씨 ${selectedWeather?.label ?? ''} · 맞춤 안내 보기`}
              className="mt-3 flex min-h-[48px] w-full items-center gap-3 rounded-[13px] bg-[var(--ub-surface-muted)] px-3 focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)]"
            >
              <span className="flex min-w-0 flex-1 items-center gap-3" aria-hidden="true">
                <span className="text-[24px] leading-none">{selectedMood?.emoji}</span>
                <FaithWeatherIcon weather={selectedWeather?.value ?? null} />
              </span>
              <Emoji3D name="check" size={21} decorative />
              <span className="text-[22px] text-[var(--ub-text-tertiary)]" aria-hidden>›</span>
            </button>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-5 gap-1.5" role="group" aria-label="오늘의 마음">
                {faithMoodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={mood === option.value}
                    onClick={() => setMood(option.value)}
                    className={`grid min-h-11 min-w-0 place-items-center rounded-[13px] focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)] ${
                      mood === option.value
                        ? 'bg-[var(--ub-color-brand)]'
                        : 'bg-[var(--ub-surface-muted)]'
                    }`}
                  >
                    <span className="text-[24px] leading-none" aria-hidden="true">{option.emoji}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1.5" role="group" aria-label="오늘의 신앙 날씨">
                {faithWeatherOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    aria-pressed={weather === option.value}
                    onClick={() => setWeather(option.value)}
                    className={`grid min-h-11 min-w-0 place-items-center rounded-[13px] focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)] ${
                      weather === option.value
                        ? 'bg-[var(--ub-surface-brand-soft)] ring-1 ring-[var(--ub-color-brand)]'
                        : 'bg-[var(--ub-surface-muted)]'
                    }`}
                  >
                    <FaithWeatherIcon weather={option.value} />
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-label={saving ? '기록 중…' : '오늘 체크인 남기기'}
                aria-busy={saving}
                onClick={saveCheckin}
                disabled={!mood || !weather || saving}
                className="mt-3 grid min-h-11 w-full place-items-center rounded-[13px] bg-[var(--ub-color-brand)] text-[23px] leading-none focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {saving ? <Emoji3D name="hourglass" size={24} decorative /> : <span aria-hidden="true">📝</span>}
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
