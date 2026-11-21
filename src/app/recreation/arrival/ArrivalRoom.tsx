'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './arrival.module.css'

type Participant = {
  id: string
  display_name: string
  joined_at: string
  arrived_at: string | null
}

type Room = {
  title: string
  appointmentAt: string
  expiresAt: string
}

type RoomResponse = {
  room: Room
  serverNow: string
  participants: Participant[]
  isHost?: boolean
  error?: string
}

const dialNumbers = Array.from({ length: 12 }, (_, index) => index === 0 ? 12 : index)

function clockPosition(angle: number, radius: number): CSSProperties {
  const radians = angle * Math.PI / 180
  return {
    left: `${50 + Math.sin(radians) * radius}%`,
    top: `${50 - Math.cos(radians) * radius}%`,
  }
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function ClockFace({ now, participants, appointmentAt }: { now: Date | null; participants: Participant[]; appointmentAt: string }) {
  const minuteAngle = now ? now.getMinutes() * 6 + now.getSeconds() * 0.1 : 0
  const hourAngle = now ? (now.getHours() % 12) * 30 + now.getMinutes() * 0.5 + now.getSeconds() / 120 : 0
  const appointment = new Date(appointmentAt)
  const appointmentAngle = (appointment.getHours() % 12) * 30 + appointment.getMinutes() * 0.5
  const arrived = participants.filter((person) => person.arrived_at)
  const arrivalsByMinute = new Map<number, number>()

  return (
    <div className={styles.clockWrap}>
      <div className={styles.clock} role="img" aria-label={`현재 ${now ? timeLabel(now.toISOString()) : '시계 준비 중'}, 도착 ${arrived.length}명`}>
        {dialNumbers.map((number) => (
          <span className={styles.clockNumber} key={number} style={clockPosition(number === 12 ? 0 : number * 30, 43)} aria-hidden>{number}</span>
        ))}
        <span className={styles.appointmentMarker} style={clockPosition(appointmentAngle, 46)} aria-hidden title={`약속 ${timeLabel(appointmentAt)}`} />
        {arrived.map((person, index) => {
          const arrivedAt = new Date(person.arrived_at!)
          const angle = (arrivedAt.getHours() % 12) * 30 + arrivedAt.getMinutes() * 0.5
          const minuteKey = Math.floor(arrivedAt.getTime() / 60000)
          const sameMinuteIndex = arrivalsByMinute.get(minuteKey) ?? 0
          arrivalsByMinute.set(minuteKey, sameMinuteIndex + 1)
          const fan = Math.floor(sameMinuteIndex / 4)
          const angleOffset = fan === 0 ? 0 : (fan % 2 ? 1 : -1) * Math.min(10, Math.ceil(fan / 2) * 4)
          const radius = 20 + (sameMinuteIndex % 4) * 6
          return (
            <span
              className={styles.nameTag}
              key={person.id}
              style={{ ...clockPosition(angle + angleOffset, radius), zIndex: 10 + index % 10 }}
              title={`${person.display_name} · ${timeLabel(person.arrived_at!)}`}
              aria-hidden
            >{person.display_name}</span>
          )
        })}
        <span className={styles.hourHand} style={{ transform: `rotate(${hourAngle}deg)` }} aria-hidden />
        <span className={styles.minuteHand} style={{ transform: `rotate(${minuteAngle}deg)` }} aria-hidden />
        <span className={styles.clockCenter} aria-hidden />
      </div>
      <div className={styles.clockLegend}><span><i className={styles.legendDot} /> 약속 {timeLabel(appointmentAt)}</span><span>이름표는 도착한 시각에 표시돼요</span></div>
    </div>
  )
}

export default function ArrivalRoom({ code }: { code: string }) {
  const serverOffset = useRef(0)
  const refreshInFlight = useRef(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isHost, setIsHost] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const [name, setName] = useState('')
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState('')

  const refresh = useCallback(async (includeHost = false) => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const requestStartedAt = Date.now()
      const response = await fetch(`/api/recreation/arrival/${code}${includeHost ? '?host=1' : ''}`, { cache: 'no-store' })
      const result = await response.json() as RoomResponse
      if (!response.ok) {
        setMessage(result.error ?? '모임을 불러오지 못했습니다.')
        return
      }
      setRoom(result.room)
      if (result.serverNow) {
        // Midpoint correction avoids displaying the network round-trip as clock drift.
        serverOffset.current = new Date(result.serverNow).getTime() - (requestStartedAt + Date.now()) / 2
        setNow(new Date(Date.now() + serverOffset.current))
      }
      setParticipants(result.participants)
      if (typeof result.isHost === 'boolean') setIsHost(result.isHost)
      setMessage('')
    } catch {
      setMessage('연결을 확인해주세요. 잠시 후 다시 새로고침합니다.')
    } finally {
      refreshInFlight.current = false
      setLoaded(true)
    }
  }, [code])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setMyParticipantId(window.localStorage.getItem(`unblind-arrival-${code}`))
      } catch {
        // Private browsing can deny storage; the room must still open.
      }
      setNow(new Date(Date.now() + serverOffset.current))
      void refresh(true)
    })
    const clockTimer = window.setInterval(() => setNow(new Date(Date.now() + serverOffset.current)), 1000)
    const onResume = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onResume)
    window.addEventListener('online', onResume)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(clockTimer)
      document.removeEventListener('visibilitychange', onResume)
      window.removeEventListener('online', onResume)
    }
  }, [code, refresh])

  useEffect(() => {
    const intervalMs = isHost ? 3500 : participants.length < 10 ? 6000 : participants.length < 30 ? 10000 : 15000
    const roomTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)
    return () => window.clearInterval(roomTimer)
  }, [isHost, participants.length, refresh])

  const myParticipant = useMemo(() => participants.find((person) => person.id === myParticipantId), [participants, myParticipantId])
  const arrivedCount = participants.filter((person) => person.arrived_at).length
  const sharedLink = typeof window === 'undefined' ? '' : `${window.location.origin}/recreation/arrival/${code}`

  async function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending('join')
    setMessage('')
    try {
      const response = await fetch(`/api/recreation/arrival/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const result = await response.json()
      if (!response.ok) {
        setMessage(result.error ?? '입장하지 못했습니다.')
        return
      }
      try {
        window.localStorage.setItem(`unblind-arrival-${code}`, result.participantId)
      } catch {
        // Joining succeeded on the server even when storage is unavailable.
      }
      setMyParticipantId(result.participantId)
      setName('')
      await refresh()
    } catch {
      setMessage('연결을 확인하고 다시 시도해주세요.')
    } finally {
      setPending('')
    }
  }

  async function setArrived(participant: Participant) {
    setPending(participant.id)
    setMessage('')
    try {
      const response = await fetch(`/api/recreation/arrival/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: participant.id, arrived: !participant.arrived_at }),
      })
      const result = await response.json()
      if (!response.ok) {
        setMessage(result.error ?? '도착 체크를 변경하지 못했습니다.')
        return
      }
      await refresh()
    } catch {
      setMessage('연결을 확인하고 다시 시도해주세요.')
    } finally {
      setPending('')
    }
  }

  async function shareRoom() {
    try {
      if (navigator.share) {
        await navigator.share({ title: room?.title ?? '일찍 와주길 바래', url: sharedLink })
      } else {
        await navigator.clipboard.writeText(sharedLink)
        setMessage('참가 링크를 복사했습니다.')
      }
    } catch {
      // Dismissing the OS share sheet is expected.
    }
  }

  if (!loaded) return <div className={styles.loading} role="status">도착 시계를 준비하고 있어요…</div>
  if (!room) return <div className={styles.loading}><p>{message || '모임을 찾지 못했습니다.'}</p><Link href="/recreation">모임 KIT로 돌아가기</Link></div>

  return (
    <div className={styles.roomStack}>
      <header className={styles.roomHeader}>
        <span className={styles.eyebrow}>일찍 와주길 바래</span>
        <h2>{room.title}</h2>
        <p>약속 · {new Date(room.appointmentAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </header>

      <section className={styles.clockCard} aria-label="실시간 도착 시계">
        <div className={styles.clockCardTop}><span className={styles.liveBadge}><i /> 실시간</span><strong>{now ? timeLabel(now.toISOString()) : '--:--'}</strong></div>
        <ClockFace now={now} participants={participants} appointmentAt={room.appointmentAt} />
      </section>

      {isHost ? (
        <section className={styles.hostCard}>
          <div className={styles.hostHeading}><div><span className={styles.eyebrow}>진행자 화면</span><h3>참가자 {participants.length}명 · 도착 {arrivedCount}명</h3></div><button type="button" className={styles.shareButton} onClick={() => void shareRoom()}>링크 공유</button></div>
          <p className={styles.hostHint}>이름이 등록되면 도착할 때 체크해주세요. 체크한 시간이 시계에 표시됩니다.</p>
          {participants.length === 0 ? <p className={styles.emptyState}>아직 입장한 사람이 없어요. 링크를 공유해보세요.</p> : (
            <ul className={styles.peopleList}>
              {participants.map((person) => (
                <li key={person.id}>
                  <span className={styles.personCopy}><strong>{person.display_name}</strong><small>{person.arrived_at ? `도착 ${timeLabel(person.arrived_at)}` : `입장 ${timeLabel(person.joined_at)}`}</small></span>
                  <button type="button" className={person.arrived_at ? styles.arrivedButton : styles.checkButton} onClick={() => void setArrived(person)} disabled={Boolean(pending)}>{pending === person.id ? '처리 중…' : person.arrived_at ? '체크 취소' : '도착 체크'}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : myParticipant ? (
        <section className={styles.joinedCard}>
          <span className={styles.eyebrow}>입장 완료</span>
          <h3>{myParticipant.display_name}님, 반가워요!</h3>
          <p>{myParticipant.arrived_at ? `${timeLabel(myParticipant.arrived_at)}에 도착했어요. 이름표가 시계에 붙었습니다.` : '진행자가 도착을 체크하면 이름표가 시계에 붙어요.'}</p>
        </section>
      ) : (
        <form className={styles.joinCard} onSubmit={(event) => void join(event)}>
          <span className={styles.eyebrow}>참가자 입장</span>
          <h3>이름을 적고 들어오세요</h3>
          <label className={styles.field}><span>시계에 표시될 이름</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="이름" required autoComplete="off" /></label>
          <button type="submit" className={styles.primaryButton} disabled={pending === 'join' || !name.trim()}>{pending === 'join' ? '입장하는 중…' : '입장하기'}</button>
        </form>
      )}

      {!isHost && participants.length > 0 && <section className={styles.summaryCard}><h3>함께 기다리는 사람들</h3><p>참가 {participants.length}명 · 도착 {arrivedCount}명</p><div className={styles.summaryNames}>{participants.map((person) => <span key={person.id} className={person.arrived_at ? styles.summaryArrived : styles.summaryWaiting}>{person.display_name}{person.arrived_at ? ` · ${timeLabel(person.arrived_at)}` : ''}</span>)}</div></section>}
      {message && <p role="status" className={styles.notice}>{message}</p>}
      <p className={styles.privacyNote}>참가 링크를 가진 사람은 이름과 도착 시간을 볼 수 있습니다. 링크는 모임 이틀 뒤 만료됩니다.</p>
    </div>
  )
}
