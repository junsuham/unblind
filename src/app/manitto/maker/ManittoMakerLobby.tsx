'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import {
  MANITTO_MAKER_DEFAULT_CAPACITY,
  MANITTO_MAKER_MAX_MEMBERS,
  MANITTO_MAKER_MIN_MEMBERS,
} from '@/lib/manittoMakerShared'

type Room = {
  code: string
  title: string
  capacity: number
  status: 'open' | 'drawn'
  participantCount: number
  expiresAt: string
}

export default function ManittoMakerLobby() {
  const router = useRouter()
  const [hostName, setHostName] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [capacity, setCapacity] = useState(MANITTO_MAKER_DEFAULT_CAPACITY)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/manitto/maker', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? '모임을 불러오지 못했습니다.')
        setRooms(Array.isArray(result.rooms) ? result.rooms : [])
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '모임을 불러오지 못했습니다.')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/manitto/maker', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, title, note, capacity }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.code) throw new Error(result?.error ?? '모임을 만들지 못했습니다.')
      router.push(`/manitto/maker/${result.code}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '모임을 만들지 못했습니다.')
      setPending(false)
    }
  }

  return (
    <div className="space-y-6 text-[var(--ub-text-primary)]">
      <section className="ub-liquid-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]"><SystemIcon name="gift" size={23} /></span>
          <div><h2 className="text-[18px] font-bold">우리 모임 기도 마니또</h2><p className="text-[12px] text-[var(--ub-text-secondary)]">한 사람을 정해, 몰래 기도하고 응원해요.</p></div>
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-[var(--ub-text-secondary)]" aria-label="마니또 진행 순서">
          <li aria-current="step" className="rounded-[12px] bg-[var(--ub-surface-brand-soft)] py-3 text-[var(--ub-color-brand)]">① 모임 설정</li>
          <li className="rounded-[12px] bg-[var(--ub-surface-muted)] py-3">② 참가자 등록</li>
          <li className="rounded-[12px] bg-[var(--ub-surface-muted)] py-3">③ 비밀 결과</li>
        </ol>
        <form onSubmit={(event) => void createRoom(event)} className="mt-5 space-y-4">
          <label className="block text-[12px] font-semibold">방장 이름<input required maxLength={24} value={hostName} onChange={(event) => setHostName(event.target.value)} placeholder="예: 다니엘" className="mt-1 block min-h-12 w-full rounded-[14px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-3 text-[16px] outline-none focus:border-[var(--ub-color-brand)]" /></label>
          <label className="block text-[12px] font-semibold">모임 이름<input required minLength={2} maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 청년부 기도 마니또" className="mt-1 block min-h-12 w-full rounded-[14px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-3 text-[16px] outline-none focus:border-[var(--ub-color-brand)]" /></label>
          <details className="rounded-[13px] bg-[var(--ub-surface-muted)] px-3">
            <summary className="cursor-pointer py-3 text-[12px] font-semibold">모임 옵션</summary>
            <div className="grid gap-3 pb-3">
              <label className="block text-[12px] font-semibold">참가 정원<input required type="number" min={MANITTO_MAKER_MIN_MEMBERS} max={MANITTO_MAKER_MAX_MEMBERS} inputMode="numeric" value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} className="mt-1 block min-h-12 w-full rounded-[14px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-3 text-[16px] outline-none focus:border-[var(--ub-color-brand)]" /></label>
              <label className="block text-[12px] font-semibold">안내 메시지 <span className="font-normal text-[var(--ub-text-tertiary)]">선택</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={200} rows={2} placeholder="예: 이번 주에는 서로를 위해 이름을 불러 기도해요" className="mt-1 block w-full resize-none rounded-[14px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-3 py-3 text-[16px] outline-none focus:border-[var(--ub-color-brand)]" /></label>
            </div>
          </details>
          <button type="submit" disabled={pending || !hostName.trim() || title.trim().length < 2} className="min-h-12 w-full rounded-[15px] bg-[var(--ub-color-brand)] px-4 text-[15px] font-bold text-white disabled:opacity-50">{pending ? '만드는 중…' : '다음 · 참가자 등록'}</button>
        </form>
        <p className="mt-3 text-[11px] leading-[17px] text-[var(--ub-text-tertiary)]">2~50명 · 배정 결과는 각자만 확인 · 30일 후 자동 만료</p>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[14px] font-bold text-[var(--ub-text-on-brand-primary)]">내가 만든 모임</h2>
        <div className="ub-liquid-card overflow-hidden">
          {loading && <p className="px-4 py-8 text-center text-[13px] text-[var(--ub-text-secondary)]">모임을 불러오는 중…</p>}
          {!loading && rooms.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-[var(--ub-text-secondary)]">아직 만든 모임이 없어요.</p>}
          {rooms.map((room) => (
            <Link key={room.code} href={`/manitto/maker/${room.code}`} className="flex min-h-[70px] items-center gap-3 border-b border-[var(--ub-separator)] px-4 py-3 text-[var(--ub-text-primary)] last:border-b-0 active:bg-[var(--ub-surface-pressed)]">
              <span className="min-w-0 flex-1"><strong className="block truncate text-[14px]">{room.title}</strong><small className="mt-1 block text-[11px] text-[var(--ub-text-secondary)]">{room.participantCount}/{room.capacity}명 · {room.status === 'drawn' ? '추첨 완료' : '참여 중'}</small></span><span aria-hidden className="text-[20px] text-[var(--ub-text-tertiary)]">›</span>
            </Link>
          ))}
        </div>
      </section>
      {error && <p role="alert" className="rounded-[14px] bg-[var(--ub-danger-soft)] p-3 text-[13px] text-[var(--ub-danger-text)]">{error}</p>}
    </div>
  )
}
