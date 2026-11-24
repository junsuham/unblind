'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { missionCategories, type MissionCategory, type MissionMode } from './missionCards'
import styles from './mission.module.css'

export default function MissionCreate() {
  const router = useRouter()
  const [mode, setMode] = useState<MissionMode>('team')
  const [teamCount, setTeamCount] = useState(2)
  const [category, setCategory] = useState<MissionCategory>('church')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/recreation/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ mode, teamCount, category }),
      })
      const result = await response.json()
      if (!response.ok || !result.id) throw new Error(result.error || '모임을 만들지 못했습니다.')
      router.push(`/recreation/mission/${result.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '모임을 만들지 못했습니다.')
      setPending(false)
    }
  }

  return (
    <div className={styles.createPage}>
      <div className={styles.intro}>
        <span className={styles.kicker}>모임 KIT · 함께하는 게임</span>
        <h2>카드 한 장으로<br />모임을 시작해요.</h2>
        <p>방식을 고르고 링크를 나누면 모두 각자의 화면에서 참여할 수 있어요.</p>
      </div>

      <section className={styles.setupCard} aria-labelledby="mission-mode-title">
        <div className={styles.sectionHeading}><span>01</span><h3 id="mission-mode-title">경기 방식</h3></div>
        <div className={styles.segmented} role="group" aria-label="경기 방식">
          <button type="button" className={mode === 'team' ? styles.segmentActive : ''} aria-pressed={mode === 'team'} onClick={() => setMode('team')}>팀전</button>
          <button type="button" className={mode === 'individual' ? styles.segmentActive : ''} aria-pressed={mode === 'individual'} onClick={() => setMode('individual')}>개인전</button>
        </div>
        {mode === 'team' && (
          <div className={styles.teamCountRow}>
            <span>참여 팀 수</span>
            <div className={styles.stepper}>
              <button type="button" aria-label="팀 수 줄이기" disabled={teamCount <= 2} onClick={() => setTeamCount((count) => count - 1)}>−</button>
              <strong>{teamCount}팀</strong>
              <button type="button" aria-label="팀 수 늘리기" disabled={teamCount >= 8} onClick={() => setTeamCount((count) => count + 1)}>＋</button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.setupCard} aria-labelledby="mission-category-title">
        <div className={styles.sectionHeading}><span>02</span><h3 id="mission-category-title">미션 종류</h3></div>
        <div className={styles.categoryGrid}>
          {(Object.entries(missionCategories) as Array<[MissionCategory, typeof missionCategories[MissionCategory]]>).map(([key, option]) => (
            <button key={key} type="button" aria-pressed={category === key} className={category === key ? styles.categoryActive : styles.category} onClick={() => setCategory(key)}>
              <span className={styles.categoryIcon} aria-hidden><SystemIcon name={option.icon} size={20} /></span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.createFooter}>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button type="button" className={styles.primaryButton} onClick={() => void createRoom()} disabled={pending}>
          {pending ? '모임 만드는 중…' : '모임 만들고 링크 공유하기'}
        </button>
        <p>링크는 7일 동안 사용할 수 있어요. 진행자만 미션을 뽑고 팀전 점수를 기록합니다.</p>
      </div>
    </div>
  )
}
