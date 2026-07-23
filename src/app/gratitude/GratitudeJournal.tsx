'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getKoreaDate } from '@/lib/dailyFaith'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import styles from './gratitude.module.css'

type GratitudeEntry = {
  id: string
  entry_date: string
  content: string
  challenge_enabled: boolean
  gratitude_voice: string | null
  delivered_at: string | null
  created_at: string
}

type ReceivedEntry = {
  id: string
  entry_date: string
  content: string
  gratitude_voice: string | null
  delivered_at: string
  sender: string
}

type GratitudeView = 'write' | 'calendar' | 'received'

function shiftMonth(value: string, amount: number) {
  const [year, month] = value.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1 + amount, 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`
}

function buildCalendarDays(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: lastDay }, (_, index) => index + 1),
  ]
}

export default function GratitudeJournal() {
  const today = getKoreaDate()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [view, setView] = useState<GratitudeView>('write')
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [received, setReceived] = useState<ReceivedEntry[]>([])
  const [challengeEnabled, setChallengeEnabled] = useState(false)
  const [content, setContent] = useState('')
  const [gratitudeVoice, setGratitudeVoice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<GratitudeEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/gratitude?month=${month}`)
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '감사 기록을 불러오지 못했습니다.')
      setEntries(result.entries ?? [])
      setReceived(result.received ?? [])
      setChallengeEnabled(Boolean(result.challengeEnabled))

      const todayEntry = (result.entries ?? []).find(
        (entry: GratitudeEntry) => entry.entry_date === today
      )
      if (todayEntry) {
        setContent(todayEntry.content)
        setGratitudeVoice(todayEntry.gratitude_voice ?? '')
        setChallengeEnabled(todayEntry.challenge_enabled)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '감사 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [month, today])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  const entriesByDate = useMemo(
    () => new Map(entries.map((entry) => [entry.entry_date, entry])),
    [entries]
  )
  const calendarDays = useMemo(() => buildCalendarDays(month), [month])

  async function save() {
    if (!content.trim() || saving) return
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/gratitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          challengeEnabled,
          gratitudeVoice,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '오늘의 감사를 저장하지 못했습니다.')

      setMessage(
        result.delivery === 'delivered'
          ? '오늘의 감사가 익명의 감사 친구에게 전해졌어요.'
          : result.delivery === 'waiting'
            ? '감사는 저장했어요. 챌린지 친구가 참여하면 다음 기록부터 전해드릴게요.'
            : '나만의 감사일기에 안전하게 저장했어요.'
      )
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '오늘의 감사를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.root}>
      <header className={styles.hero}>
        <p>GRATITUDE JOURNAL</p>
        <h1>하루 한 줄이면 충분해요</h1>
        <span>작은 감사를 모아 한 달의 은혜를 돌아보세요.</span>
      </header>

      <nav className={styles.tabs} aria-label="감사일기 메뉴">
        {([
          ['write', '오늘 기록'],
          ['calendar', '감사 달력'],
          ['received', '도착한 감사'],
        ] as Array<[GratitudeView, string]>).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-current={view === key ? 'page' : undefined}
            className={view === key ? styles.tabActive : styles.tab}
            onClick={() => setView(key)}
          >
            {label}
            {key === 'received' && received.length > 0 && <b>{received.length}</b>}
          </button>
        ))}
      </nav>

      {view === 'write' && (
        <div className={styles.writeStack}>
          <section className={styles.challengeCard}>
            <div>
              <p>감사일기 챌린지</p>
              <strong>{challengeEnabled ? 'ON · 익명으로 감사 이어가기' : 'OFF · 나만 보는 감사일기'}</strong>
              <span>ON이면 챌린지에 참여한 다음 사람에게 익명으로 전해져요.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={challengeEnabled}
              aria-label="감사일기 챌린지"
              className={challengeEnabled ? styles.switchOn : styles.switch}
              onClick={() => setChallengeEnabled((current) => !current)}
            >
              <span />
            </button>
          </section>

          <section className={styles.diary} aria-labelledby="gratitude-write-title">
            <div className={styles.binding} aria-hidden>
              {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
            </div>
            <div className={styles.paper}>
              <div className={styles.dateLine}>
                <span>{new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</span>
                <SystemIcon name="leaf" size={20} />
              </div>
              <label htmlFor="gratitude-content" id="gratitude-write-title">오늘 감사한 한 가지</label>
              <textarea
                id="gratitude-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={280}
                rows={5}
                placeholder="오늘 마음에 남은 감사를 한 줄로 적어보세요."
              />
              <span className={styles.counter}>{content.length}/280</span>

              {challengeEnabled && (
                <div className={styles.voiceField}>
                  <label htmlFor="gratitude-voice">다음 사람에게 전할 감사의 목소리</label>
                  <textarea
                    id="gratitude-voice"
                    value={gratitudeVoice}
                    onChange={(event) => setGratitudeVoice(event.target.value)}
                    maxLength={280}
                    rows={3}
                    placeholder="당신의 오늘에도 감사할 일이 꼭 있기를 기도해요."
                  />
                  <span>{gratitudeVoice.length}/280</span>
                </div>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={save}
            disabled={!content.trim() || (challengeEnabled && !gratitudeVoice.trim()) || saving}
            className={styles.saveButton}
          >
            <SystemIcon name={challengeEnabled ? 'gift' : 'check'} size={19} />
            {saving ? '저장 중…' : challengeEnabled ? '감사 저장하고 전하기' : '오늘의 감사 저장'}
          </button>
          {message && <p className={styles.success} role="status">{message}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}

          {entries.length > 0 && (
            <section className={styles.history}>
              <div className={styles.sectionTitle}>
                <div>
                  <p>MEMORY</p>
                  <h2>지난 감사 다시 보기</h2>
                </div>
                <span>{entries.length}일</span>
              </div>
              <div className={styles.historyList}>
                {entries.slice(0, 5).map((entry) => (
                  <article key={entry.id}>
                    <time dateTime={entry.entry_date}>{Number(entry.entry_date.slice(8, 10))}일</time>
                    <p>{entry.content}</p>
                    {entry.challenge_enabled && <SystemIcon name="gift" size={16} />}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <section className={styles.calendarCard}>
          <header>
            <button type="button" aria-label="이전 달" onClick={() => setMonth((current) => shiftMonth(current, -1))}>‹</button>
            <h2>{Number(month.slice(0, 4))}년 {Number(month.slice(5, 7))}월</h2>
            <button type="button" aria-label="다음 달" onClick={() => setMonth((current) => shiftMonth(current, 1))}>›</button>
          </header>
          <div className={styles.weekdays}>
            {'일월화수목금토'.split('').map((day) => <span key={day}>{day}</span>)}
          </div>
          {loading ? (
            <div className={styles.calendarLoading} />
          ) : (
            <div className={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (!day) return <span key={`blank-${index}`} />
                const date = `${month}-${String(day).padStart(2, '0')}`
                const entry = entriesByDate.get(date)
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!entry}
                    title={entry?.content}
                    className={entry ? styles.gratefulDay : styles.calendarDay}
                    onClick={() => {
                      if (!entry) return
                      setSelectedEntry(entry)
                    }}
                  >
                    <span>{day}</span>
                    {entry && <b>♥</b>}
                  </button>
                )
              })}
            </div>
          )}
          <p className={styles.calendarSummary}>
            <SystemIcon name="calendar" size={17} />
            이번 달 감사 {entries.length}일
          </p>
          {selectedEntry && selectedEntry.entry_date.startsWith(month) && (
            <article className={styles.calendarMemory}>
              <time dateTime={selectedEntry.entry_date}>
                {Number(selectedEntry.entry_date.slice(5, 7))}월 {Number(selectedEntry.entry_date.slice(8, 10))}일의 감사
              </time>
              <p>“{selectedEntry.content}”</p>
              {selectedEntry.challenge_enabled && (
                <span><SystemIcon name="gift" size={15} /> 감사 챌린지로 전한 기록</span>
              )}
            </article>
          )}
        </section>
      )}

      {view === 'received' && (
        <section className={styles.receivedStack}>
          <div className={styles.sectionTitle}>
            <div>
              <p>ANONYMOUS GIFT</p>
              <h2>나에게 도착한 감사</h2>
            </div>
            <SystemIcon name="gift" size={23} />
          </div>
          {received.length > 0 ? received.map((entry) => (
            <article key={entry.id} className={styles.receivedCard}>
              <div>
                <strong>{entry.sender}</strong>
                <time dateTime={entry.delivered_at}>
                  {new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(entry.delivered_at))}
                </time>
              </div>
              <blockquote>“{entry.content}”</blockquote>
              {entry.gratitude_voice && (
                <p><SystemIcon name="message" size={16} /> {entry.gratitude_voice}</p>
              )}
            </article>
          )) : (
            <div className={styles.empty}>
              <SystemIcon name="gift" size={30} />
              <strong>아직 도착한 감사가 없어요</strong>
              <span>챌린지를 켜고 감사의 흐름에 함께해보세요.</span>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
