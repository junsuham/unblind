'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { missionCategories, type MissionCard, type MissionCategory, type MissionMode } from '../missionCards'
import { isMissionPoints, type MissionStanding } from '../missionBoard'
import styles from '../mission.module.css'

type Assignment = { card: MissionCard | null; roundNo: number; drawnAt: string }
type RoomState = {
  room: {
    id: string
    mode: MissionMode
    teamCount: number
    category: MissionCategory
    assignments?: Record<string, Assignment>
    roundNo: number
    expiresAt: string
  }
  participantCount: number
  board?: { available: boolean; standings: MissionStanding[] } | null
  participant?: { name: string; team_number: number | null }
  assignment?: Assignment | null
  participants?: Array<{ id: string; name: string; team_number: number | null; joined_at: string }>
}

function MissionCardView({ card, roundNo }: { card: MissionCard; roundNo: number }) {
  const [revealed, setRevealed] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <article className={styles.drawnCard}>
      <div className={styles.drawnCardTop}><span>MISSION {String(roundNo).padStart(2, '0')}</span><span>✦</span></div>
      {card.image && (
        <div className={styles.photoFrame}>
          {photoFailed ? (
            <p role="status">사진을 불러오지 못했어요. 아래 출처에서 사진을 확인할 수 있습니다.</p>
          ) : (
            <Image src={card.image} alt="미션 카드의 실제 음식 사진" width={900} height={680} onError={() => setPhotoFailed(true)} />
          )}
        </div>
      )}
      <div className={styles.drawnCardBody}>
        {card.image ? (
          <>
            <span className={styles.cardLabel}>사진 미션</span>
            <h3>{revealed ? card.title : '이 메뉴는 무엇일까요?'}</h3>
            <p>{card.instruction}</p>
            {!revealed && <button type="button" className={styles.revealButton} onClick={() => setRevealed(true)}>정답 보기</button>}
          </>
        ) : (
          <>
            <span className={styles.cardLabel}>함께하는 미션</span>
            <h3>{card.title}</h3>
            <p>{card.instruction}</p>
          </>
        )}
        {card.source && card.photoCredit && (
          <p className={styles.photoCredit}>
            사진: {card.photoCredit.author} ·{' '}
            <a href={card.photoCredit.licenseUrl} target="_blank" rel="noopener noreferrer">{card.photoCredit.license}</a>
            {' '}· {card.photoCredit.modification} ·{' '}
            <a href={card.source} target="_blank" rel="noopener noreferrer">원본 파일 ↗</a>
          </p>
        )}
      </div>
    </article>
  )
}

function MissionScoreActions({
  standing,
  pending,
  onSubmit,
}: {
  standing: MissionStanding
  pending: boolean
  onSubmit: (action: 'complete' | 'score' | 'reopen', draft: string) => void
}) {
  const [draft, setDraft] = useState(String(standing.currentPoints ?? 10))

  return (
    <div className={styles.missionScoreControls}>
      <label>점수
        <input type="number" min="0" max="100" step="1" inputMode="numeric" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="이번 미션 점수" />
      </label>
      {standing.currentCompleted ? (
        <>
          <button type="button" disabled={pending} onClick={() => onSubmit('score', draft)}>점수 수정</button>
          <button type="button" disabled={pending} onClick={() => onSubmit('reopen', draft)}>완료 취소</button>
        </>
      ) : <button type="button" disabled={pending} onClick={() => onSubmit('complete', draft)}>완료 처리</button>}
    </div>
  )
}

export default function MissionRoom({ roomId, isHost }: { roomId: string; isHost: boolean }) {
  const [state, setState] = useState<RoomState | null>(null)
  const guestTokenRef = useRef<string | null>(null)
  const refreshInFlight = useRef(false)
  const [name, setName] = useState('')
  const [teamNumber, setTeamNumber] = useState(1)
  const [selectedTarget, setSelectedTarget] = useState('team:1')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState(false)

  const storageKey = `unblind-mission-participant-${roomId}`

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const token = guestTokenRef.current
      let response = await fetch(`/api/recreation/mission/${roomId}${isHost ? '?host=1' : ''}`, {
        cache: 'no-store',
        headers: token && !isHost ? { 'x-mission-guest-token': token } : undefined,
      })
      let result = await response.json()
      if (response.status === 401 && result.code === 'INVALID_PARTICIPANT_TOKEN' && token) {
        guestTokenRef.current = null
        try { window.localStorage.removeItem(storageKey) } catch { /* optional storage */ }
        response = await fetch(`/api/recreation/mission/${roomId}`, { cache: 'no-store' })
        result = await response.json()
        setMessage('입장 정보가 만료되어 다시 입장이 필요합니다.')
      }
      if (!response.ok) throw new Error(result.error || '모임을 불러오지 못했습니다.')
      setState(result as RoomState)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '모임을 불러오지 못했습니다.')
    } finally {
      refreshInFlight.current = false
      setLoaded(true)
    }
  }, [roomId, isHost, storageKey])

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey)
        if (stored) guestTokenRef.current = stored
      } catch {
        // Storage access is optional; guests can still enter this room.
      }
      void refresh()
    }, 0)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(restoreTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, storageKey])

  useEffect(() => {
    const count = state?.participantCount ?? 0
    const intervalMs = isHost ? 3500 : count < 10 ? 6000 : count < 30 ? 10000 : 15000
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [isHost, state?.participantCount, refresh])

  const myParticipant = state?.participant
  const targetOptions = useMemo(() => {
    if (!state) return []
    if (state.room.mode === 'team') return Array.from({ length: state.room.teamCount }, (_, index) => ({ value: `team:${index + 1}`, label: `${index + 1}팀` }))
    return (state.participants ?? []).map((person) => ({ value: `person:${person.id}`, label: person.name }))
  }, [state])
  const activeTarget = targetOptions.some((target) => target.value === selectedTarget) ? selectedTarget : targetOptions[0]?.value
  const assignment = isHost && activeTarget ? state?.room.assignments?.[activeTarget] : state?.assignment
  const missionCategory = state ? missionCategories[state.room.category] : null
  const selectedTeamNumber = isHost
    ? (activeTarget?.startsWith('team:') ? Number(activeTarget.slice(5)) : null)
    : (myParticipant?.team_number ?? null)
  const selectedStanding = state?.board?.standings.find((standing) => standing.teamNumber === selectedTeamNumber)

  async function joinRoom() {
    if (!state) return
    setPending(true)
    setError('')
    try {
      const response = await fetch(`/api/recreation/mission/${roomId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'join', name, teamNumber }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '모임에 입장하지 못했습니다.')
      guestTokenRef.current = result.token
      try {
        window.localStorage.setItem(storageKey, result.token)
      } catch {
        // Keep the successful join in component state for this visit.
      }
      setMessage('입장했어요! 진행자가 미션을 뽑으면 여기에 나타납니다.')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '모임에 입장하지 못했습니다.')
    } finally {
      setPending(false)
    }
  }

  async function drawCard() {
    if (!activeTarget) return
    setPending(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/recreation/mission/${roomId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ action: 'draw', targetKey: activeTarget }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '미션을 뽑지 못했습니다.')
      await refresh()
      setMessage('새 미션을 뽑았어요. 참여자 화면에도 곧 표시됩니다.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '미션을 뽑지 못했습니다.')
    } finally {
      setPending(false)
    }
  }

  async function updateBoard(action: 'complete' | 'score' | 'reopen', scoreDraft: string) {
    if (!selectedStanding?.currentRoundNo || !selectedTeamNumber) return
    const points = Number(scoreDraft)
    if (action !== 'reopen' && (!scoreDraft.trim() || !isMissionPoints(points))) {
      setError('점수는 0~100점의 정수로 입력해주세요.')
      return
    }
    setPending(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/recreation/mission/${roomId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({
          action,
          teamNumber: selectedTeamNumber,
          roundNo: selectedStanding.currentRoundNo,
          points,
          expectedPoints: selectedStanding.currentPoints,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '미션보드를 저장하지 못했습니다.')
      await refresh()
      setMessage(action === 'complete' ? '미션 완료와 점수를 공유했어요.' : action === 'score' ? '점수를 수정했어요.' : '완료를 취소했어요.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '미션보드를 저장하지 못했습니다.')
      await refresh()
    } finally {
      setPending(false)
    }
  }

  async function shareRoom() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: '언블라인드 랜덤 미션', text: '우리 모임의 랜덤 미션에 참여해요!', url }) } catch { /* sharing was dismissed */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setMessage('초대 링크를 복사했어요.')
    } catch {
      setMessage('주소창의 링크를 복사해 공유해주세요.')
    }
  }

  return (
    <main className={styles.roomPage}>
      <header className={styles.roomHeader}>
        <div className={styles.roomHeaderInner}>
          <Link href={isHost ? '/recreation' : '/'} aria-label="언블라인드로 이동" className={styles.roomBrand}>UNBLIND <span>모임 KIT</span></Link>
          {isHost && <button type="button" onClick={() => void shareRoom()} className={styles.headerShare}>링크 공유 ↗</button>}
        </div>
      </header>
      <div className={styles.roomContent}>
        {!loaded && <p className={styles.loading}>모임을 불러오는 중…</p>}
        {loaded && !state && <div className={styles.emptyCard}><h1>모임을 열 수 없어요</h1><p>{error || '링크를 다시 확인해주세요.'}</p><Link href="/">홈으로 이동</Link></div>}
        {state && missionCategory && (
          <>
            <div className={styles.roomIntro}>
              <span className={styles.kicker}><SystemIcon name={missionCategory.icon} size={15} /> {missionCategory.label} 미션 · {state.room.mode === 'team' ? '팀전' : '개인전'}</span>
              <h1>{state.room.mode === 'team' ? '함께하는 미션보드' : '랜덤 미션 뽑기'}</h1>
              <p>{state.room.mode === 'team' ? '미션 카드를 뽑고 완료하면 팀 점수가 모두에게 공유돼요.' : '진행자가 카드를 뽑으면 내 화면에 미션이 나타나요.'}</p>
            </div>

            {!isHost && !myParticipant && (
              <section className={styles.joinCard} aria-label="모임 입장">
                <h2>모임에 입장하기</h2>
                <p>{state.room.mode === 'team' ? '팀을 고르고 입장해 주세요. 이름은 선택 사항이에요.' : '사용할 이름을 입력해 주세요.'}</p>
                <label className={styles.inputLabel}>이름 {state.room.mode === 'team' && <span>선택</span>}
                  <input type="text" value={name} maxLength={24} onChange={(event) => setName(event.target.value)} placeholder={state.room.mode === 'team' ? '비워두면 임의 이름으로 입장' : '이름 입력'} />
                </label>
                {state.room.mode === 'team' && (
                  <label className={styles.inputLabel}>내 팀
                    <select value={teamNumber} onChange={(event) => setTeamNumber(Number(event.target.value))}>
                      {Array.from({ length: state.room.teamCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}팀</option>)}
                    </select>
                  </label>
                )}
                <button type="button" className={styles.primaryButton} disabled={pending} onClick={() => void joinRoom()}>{pending ? '입장 중…' : '입장하기'}</button>
              </section>
            )}

            {isHost && (
              <section className={styles.hostCard} aria-label="진행자 미션 뽑기">
                <div className={styles.hostCardHeading}><div><span>진행자 화면</span><h2>누구에게 미션을 줄까요?</h2></div><span className={styles.livePill}>● LIVE</span></div>
                <div className={styles.hostControls}>
                  <select aria-label="미션 받을 팀 또는 참가자" value={activeTarget ?? ''} onChange={(event) => setSelectedTarget(event.target.value)} disabled={!targetOptions.length}>
                    {targetOptions.length ? targetOptions.map((target) => <option key={target.value} value={target.value}>{target.label}</option>) : <option value="">참가자를 기다리는 중</option>}
                  </select>
                  <button type="button" className={styles.primaryButton} disabled={pending || !activeTarget} onClick={() => void drawCard()}>{pending ? '뽑는 중…' : '랜덤 미션 뽑기'}</button>
                </div>
                <button type="button" className={styles.textShare} onClick={() => void shareRoom()}>참가자에게 링크 공유 ↗</button>
                {state.room.mode === 'team' && selectedStanding?.currentRoundNo && !selectedStanding.currentCompleted && (
                  <p className={styles.hostHint}>같은 팀에 새 카드를 뽑으면 현재 미션은 점수 없이 넘어갑니다.</p>
                )}
              </section>
            )}

            {(isHost || myParticipant) && (
              <section className={styles.missionSection} aria-label="내 미션 카드">
                <div className={styles.sectionTop}><h2>{isHost ? `${targetOptions.find((target) => target.value === activeTarget)?.label ?? '참가자'} 미션` : state.room.mode === 'team' ? `${myParticipant?.team_number}팀 미션` : `${myParticipant?.name}님의 미션`}</h2><span>ROUND {assignment?.roundNo ?? '—'}</span></div>
                {assignment?.card ? <MissionCardView key={`${isHost ? activeTarget : 'mine'}-${assignment.roundNo}`} card={assignment.card} roundNo={assignment.roundNo} /> : <div className={styles.waitingCard}><span aria-hidden>✦</span><strong>아직 뽑힌 미션이 없어요</strong><p>{isHost ? '참가자를 선택하고 미션을 뽑아 보세요.' : '진행자가 미션을 뽑을 때까지 기다려 주세요.'}</p></div>}
                {state.room.mode === 'team' && assignment?.card && state.board?.available && (
                  <div className={styles.missionCompletion}>
                    <span>{selectedStanding?.currentCompleted ? `완료 · ${selectedStanding.currentPoints}점` : '진행 중'}</span>
                    {isHost && selectedStanding && (
                      <MissionScoreActions
                        key={`${selectedStanding.teamNumber}:${selectedStanding.currentRoundNo}:${selectedStanding.currentPoints}`}
                        standing={selectedStanding}
                        pending={pending}
                        onSubmit={(action, draft) => void updateBoard(action, draft)}
                      />
                    )}
                  </div>
                )}
              </section>
            )}

            {state.room.mode === 'team' && (
              <section className={styles.boardCard} aria-label="팀 미션보드">
                <div className={styles.sectionTop}><h2>팀 미션보드</h2><span>공유 순위</span></div>
                {state.board?.available ? (
                  <>
                    <div className={styles.boardList} aria-live="polite">
                      {state.board.standings.map((standing, index) => (
                        <div className={styles.boardRow} key={standing.teamNumber}>
                          <b className={styles.boardRank}>{index + 1}</b>
                          <span className={styles.boardTeam}>{standing.teamNumber}팀<small>{standing.currentRoundNo ? standing.currentCompleted ? '현재 미션 완료' : '미션 진행 중' : '미션 대기 중'}</small></span>
                          <span className={styles.boardPoints}><strong>{standing.points}</strong><small>점 · 완료 {standing.completedCount}</small></span>
                        </div>
                      ))}
                    </div>
                    {isHost && <p className={styles.boardNote}>여기서 완료한 점수만 참여자에게 공유돼요. KIT 진행 도구의 수동 점수는 이 방과 별개입니다.</p>}
                  </>
                ) : <p className={styles.boardNote}>공유 미션보드를 준비하는 중이에요. 잠시 후 다시 열어주세요.</p>}
              </section>
            )}

            {isHost && (
              <section className={styles.roster} aria-label="참여자 목록">
                <div className={styles.sectionTop}><h2>참여한 사람</h2><span>{state.participantCount}명</span></div>
                {state.participants?.length ? (
                  <div className={styles.rosterList}>{state.participants.map((person) => <div key={person.id}><span>{person.name}</span><small>{person.team_number ? `${person.team_number}팀` : '개인전'}</small></div>)}</div>
                ) : <p className={styles.rosterEmpty}>링크를 공유하면 참여한 사람이 여기에 표시돼요.</p>}
              </section>
            )}
            {!isHost && myParticipant && <p className={styles.joinedNote}>{myParticipant.name}님으로 입장했어요 · 현재 {state.participantCount}명 참여 중</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            {message && <p className={styles.success} role="status">{message}</p>}
            <p className={styles.roomFootnote}>미션은 진행자가 뽑으며, 연결된 화면에서 자동으로 업데이트됩니다.</p>
          </>
        )}
      </div>
    </main>
  )
}
