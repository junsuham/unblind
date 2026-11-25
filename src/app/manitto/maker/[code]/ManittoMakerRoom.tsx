'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type RoomState = {
  room: {
    code: string
    title: string
    note: string
    capacity: number
    status: 'open' | 'drawn'
    drawnAt: string | null
    expiresAt: string
  }
  participantCount: number
  isHost: boolean
  participants?: { id: string; name: string; joinedAt: string }[]
  me?: { name: string; recipientName: string | null }
  tokenInvalid?: boolean
}

const tokenPattern = /^[A-Za-z0-9_-]{43}$/

export default function ManittoMakerRoom({ code }: { code: string }) {
  const [state, setState] = useState<RoomState | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const tokenRef = useRef<string | null>(null)
  const refreshInFlight = useRef(false)
  const storageKey = `unblind-manitto-maker:${code}`

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const response = await fetch(`/api/manitto/maker/${code}?host=1`, {
        cache: 'no-store',
        headers: tokenRef.current ? { 'x-manitto-maker-guest-token': tokenRef.current } : undefined,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.room) throw new Error(result?.error ?? '모임을 불러오지 못했습니다.')
      if (result.tokenInvalid && tokenRef.current) {
        tokenRef.current = null
        try { window.localStorage.removeItem(storageKey) } catch { /* optional storage */ }
        setNotice('이 기기의 참여 정보가 유효하지 않아요. 진행자에게 이름 확인을 요청해주세요.')
      }
      setState(result as RoomState)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '모임을 불러오지 못했습니다.')
    } finally {
      refreshInFlight.current = false
      setLoading(false)
    }
  }, [code, storageKey])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const privateToken = new URLSearchParams(window.location.hash.slice(1)).get('guest')
      if (privateToken && tokenPattern.test(privateToken)) {
        tokenRef.current = privateToken
        try { window.localStorage.setItem(storageKey, privateToken) } catch { /* optional storage */ }
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
      } else {
        try { tokenRef.current = window.localStorage.getItem(storageKey) } catch { /* optional storage */ }
      }
      void refresh()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh, storageKey])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, state?.room.status === 'open' ? 12_000 : 30_000)
    return () => window.clearInterval(timer)
  }, [refresh, state?.room.status])

  async function postAction(body: Record<string, unknown>) {
    const response = await fetch(`/api/manitto/maker/${code}`, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) throw new Error(result?.error ?? '요청을 처리하지 못했습니다.')
    return result
  }

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const result = await postAction({ action: 'join', name })
      tokenRef.current = result.token
      try { window.localStorage.setItem(storageKey, result.token) } catch { /* same-visit session still works */ }
      setNotice('입장했어요. 진행자가 추첨하면 이곳에 결과가 표시됩니다.')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '입장하지 못했습니다.')
    } finally { setPending(false) }
  }

  async function draw() {
    if (!window.confirm('참가자 이름을 모두 확인했나요? 추첨 후에는 참가자와 결과를 바꿀 수 없습니다.')) return
    setPending(true)
    setError('')
    try {
      await postAction({ action: 'draw' })
      setNotice('추첨이 완료됐어요. 참가자가 각자의 기기에서 비밀 결과를 확인할 수 있습니다.')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '추첨하지 못했습니다.')
    } finally { setPending(false) }
  }

  async function remove(participantId: string, participantName: string) {
    if (!window.confirm(`${participantName}님을 참가자 목록에서 제외할까요?`)) return
    setPending(true)
    setError('')
    try {
      await postAction({ action: 'remove', participantId })
      setNotice(`${participantName}님을 제외했어요.`)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '제외하지 못했습니다.')
    } finally { setPending(false) }
  }

  async function share() {
    const url = `${window.location.origin}/manitto/maker/${code}`
    if (navigator.share) {
      try { await navigator.share({ title: state?.room.title ?? '마니또 모임', text: '마니또 모임에 참여해요!', url }); return } catch { /* user dismissed or share unavailable */ }
    }
    try { await navigator.clipboard.writeText(url); setNotice('초대 링크를 복사했어요.') }
    catch { setNotice('주소창의 링크를 복사해 공유해주세요.') }
  }

  async function savePrivateLink() {
    if (!tokenRef.current) return
    const url = `${window.location.origin}/manitto/maker/${code}#guest=${tokenRef.current}`
    try { await navigator.clipboard.writeText(url); setNotice('내 비밀 확인 링크를 복사했어요. 다른 사람에게 공유하지 마세요.') }
    catch { setNotice('비밀 링크를 복사하지 못했어요. 이 기기의 브라우저 기록을 유지해주세요.') }
  }

  if (loading && !state) return <p className="py-12 text-center text-[13px] text-[var(--ub-text-on-brand-secondary)]">마니또 모임을 불러오는 중…</p>
  if (!state) return <section className="ub-liquid-card p-5"><h2 className="text-[17px] font-bold">모임을 열 수 없어요</h2><p className="mt-2 text-[13px] text-[var(--ub-text-secondary)]">{error || '초대 링크를 다시 확인해주세요.'}</p></section>

  const { room } = state
  return (
    <div className="space-y-5 text-[var(--ub-text-primary)]">
      <section className="ub-liquid-card p-5">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ub-surface-brand-soft)] px-3 py-1 text-[11px] font-bold text-[var(--ub-color-brand)]"><SystemIcon name="gift" size={14} /> {room.status === 'drawn' ? '추첨 완료' : '참가자 모집 중'}</span>
        <h2 className="mt-3 break-keep text-[22px] font-extrabold">{room.title}</h2>
        {room.note && <p className="mt-2 whitespace-pre-wrap break-keep text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">{room.note}</p>}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--ub-separator)] pt-3 text-[12px]"><span>{state.participantCount}/{room.capacity}명 참여</span><span className="text-[var(--ub-text-tertiary)]">{new Date(room.expiresAt).toLocaleDateString('ko-KR')} 만료</span></div>
        {room.status === 'open' && <button type="button" onClick={() => void share()} className="mt-4 min-h-11 w-full rounded-[14px] bg-[var(--ub-surface-brand-soft)] px-4 text-[13px] font-bold text-[var(--ub-color-brand)]">초대 링크 공유하기 ↗</button>}
      </section>

      {state.me ? (
        <section className="ub-liquid-card p-5 text-center">
          {room.status === 'drawn' && state.me.recipientName ? (
            <><p className="text-[12px] font-semibold text-[var(--ub-text-secondary)]">{state.me.name}님이 몰래 챙길 사람</p><p className="mt-3 text-[26px] font-extrabold text-[var(--ub-color-brand)]">{state.me.recipientName}</p><p className="mt-3 text-[12px] leading-[19px] text-[var(--ub-text-secondary)]">이 결과는 이 기기에서만 볼 수 있어요. 다른 사람에게 보여 주지 마세요.</p></>
          ) : <><h3 className="text-[17px] font-bold">{state.me.name}님, 입장 완료!</h3><p className="mt-2 text-[13px] text-[var(--ub-text-secondary)]">진행자가 추첨하면 이 화면에서 비밀 결과를 확인할 수 있어요.</p></>}
          <button type="button" onClick={() => void savePrivateLink()} className="mt-4 min-h-10 rounded-[12px] bg-[var(--ub-surface-brand-soft)] px-4 text-[12px] font-semibold text-[var(--ub-color-brand)]">내 비밀 확인 링크 복사</button>
          <p className="mt-2 text-[11px] text-[var(--ub-text-tertiary)]">다른 기기에서 결과를 확인할 때만 사용하세요. 이 링크를 가진 사람은 내 결과를 볼 수 있어요.</p>
        </section>
      ) : room.status === 'open' ? (
        <section className="ub-liquid-card p-5"><h3 className="text-[17px] font-bold">모임에 입장하기</h3><p className="mt-1 text-[12px] leading-[18px] text-[var(--ub-text-secondary)]">이름은 진행자와 같은 모임 참가자에게만 확인됩니다. 추첨 전 진행자가 명단을 확인해요.</p><form onSubmit={(event) => void join(event)} className="mt-4"><label className="block text-[12px] font-semibold">내 이름<input required maxLength={24} value={name} onChange={(event) => setName(event.target.value)} placeholder="모임에서 사용할 이름" className="mt-1 block min-h-12 w-full rounded-[14px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-3 text-[15px] outline-none focus:border-[var(--ub-color-brand)]" /></label><button type="submit" disabled={pending || state.participantCount >= room.capacity} className="mt-3 min-h-12 w-full rounded-[14px] bg-[var(--ub-color-brand)] text-[14px] font-bold text-white disabled:opacity-50">{state.participantCount >= room.capacity ? '모집 인원 마감' : pending ? '입장 중…' : '이름으로 입장하기'}</button></form></section>
      ) : <section className="ub-liquid-card p-5 text-center"><h3 className="text-[16px] font-bold">추첨이 완료됐어요</h3><p className="mt-2 text-[12px] leading-[19px] text-[var(--ub-text-secondary)]">이 기기에 입장 기록이 없다면 결과를 볼 수 없습니다. 진행자에게 확인해주세요.</p></section>}

      {state.isHost && (
        <section className="ub-liquid-card p-5"><div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">진행자 관리</h3><span className="text-[11px] text-[var(--ub-text-tertiary)]">{state.participantCount}명</span></div><p className="mt-1 text-[12px] leading-[18px] text-[var(--ub-text-secondary)]">참가자 이름을 확인하고 추첨하세요. 결과는 진행자에게도 보이지 않습니다.</p><div className="mt-4 divide-y divide-[var(--ub-separator)] rounded-[14px] bg-[var(--ub-surface-muted)] px-3">{state.participants?.length ? state.participants.map((person) => <div key={person.id} className="flex min-h-11 items-center justify-between gap-2"><span className="min-w-0 truncate text-[13px]">{person.name}</span>{room.status === 'open' && <button type="button" disabled={pending} onClick={() => void remove(person.id, person.name)} className="min-h-9 shrink-0 px-2 text-[11px] font-semibold text-[var(--ub-danger-text)] disabled:opacity-50">제외</button>}</div>) : <p className="py-4 text-center text-[12px] text-[var(--ub-text-tertiary)]">초대 링크를 공유하면 참가자가 표시됩니다.</p>}</div>{room.status === 'open' && <button type="button" disabled={pending || state.participantCount < 3} onClick={() => void draw()} className="mt-4 min-h-12 w-full rounded-[14px] bg-[var(--ub-color-brand)] text-[14px] font-bold text-white disabled:opacity-50">{pending ? '처리 중…' : '비밀 마니또 추첨하기'}</button>}{room.status === 'drawn' && <p className="mt-3 text-[12px] text-[var(--ub-text-secondary)]">추첨이 완료되어 명단과 결과를 바꿀 수 없어요.</p>}</section>
      )}

      {notice && <p role="status" className="rounded-[13px] bg-[var(--ub-surface-brand-soft)] p-3 text-[12px] text-[var(--ub-text-primary)]">{notice}</p>}
      {error && <p role="alert" className="rounded-[13px] bg-[var(--ub-danger-soft)] p-3 text-[12px] text-[var(--ub-danger-text)]">{error}</p>}
      <p className="px-2 text-center text-[11px] leading-[17px] text-[var(--ub-text-on-brand-tertiary)]">모임 링크는 누구나 열 수 있으니 신뢰할 수 있는 사람과만 공유하세요. 결과는 각 참가자의 입장 기록을 보관한 기기에서만 확인됩니다.</p>
    </div>
  )
}
