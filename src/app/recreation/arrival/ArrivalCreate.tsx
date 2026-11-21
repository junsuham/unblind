'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './arrival.module.css'

type RecentRoom = {
  room_code: string
  title: string
  appointment_at: string
}

function suggestedTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default function ArrivalCreate() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [appointmentAt, setAppointmentAt] = useState('')
  const [rooms, setRooms] = useState<RecentRoom[]>([])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAppointmentAt(suggestedTime()))
    void fetch('/api/recreation/arrival', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setRooms(result?.rooms ?? []))
      .catch(() => undefined)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const date = new Date(appointmentAt)
    if (!Number.isFinite(date.getTime())) {
      setMessage('약속 시간을 확인해주세요.')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const response = await fetch('/api/recreation/arrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, appointmentAt: date.toISOString() }),
      })
      const result = await response.json()
      if (!response.ok) {
        setMessage(result.error ?? '모임 링크를 만들지 못했습니다.')
        return
      }
      router.push(`/recreation/arrival/${result.roomCode}?host=1`)
    } catch {
      setMessage('네트워크 연결을 확인해주세요.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.createStack}>
      <section className={styles.introCard}>
        <span className={styles.eyebrow}>모임 KIT · 도착 시계</span>
        <h2>누가 언제 왔는지<br />시계에 이름을 붙여요</h2>
        <p>약속 시간을 정하고 링크를 공유하세요. 친구가 이름을 입력하면 진행자가 도착을 체크할 수 있어요.</p>
      </section>

      <form className={styles.formCard} onSubmit={(event) => void createRoom(event)}>
        <h3>새 모임 만들기</h3>
        <label className={styles.field}>
          <span>시계 위에 표시할 제목</span>
          <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="예: 토요일 청년부 모임" required />
        </label>
        <label className={styles.field}>
          <span>약속 시간</span>
          <input type="datetime-local" value={appointmentAt} onChange={(event) => setAppointmentAt(event.target.value)} required />
        </label>
        <button className={styles.primaryButton} type="submit" disabled={pending || !title.trim() || !appointmentAt}>
          {pending ? '링크 만드는 중…' : '도착 시계 만들기'}
        </button>
        {message && <p role="alert" className={styles.error}>{message}</p>}
      </form>

      {rooms.length > 0 && (
        <section className={styles.recentCard} aria-labelledby="arrival-recent-title">
          <h3 id="arrival-recent-title">진행 중인 모임</h3>
          {rooms.map((room) => (
            <Link key={room.room_code} className={styles.recentLink} href={`/recreation/arrival/${room.room_code}?host=1`}>
              <span><strong>{room.title}</strong><small>{new Date(room.appointment_at).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}</small></span>
              <span aria-hidden>›</span>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
