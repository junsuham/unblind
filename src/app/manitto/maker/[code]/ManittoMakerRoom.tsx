'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import {
  MANITTO_MAKER_MIN_MEMBERS,
  MANITTO_MAKER_TOKEN_HEADER,
  getManittoMakerMission,
  isManittoMakerToken,
} from '@/lib/manittoMakerShared'
import { ManittoMakerRoster, type RosterPerson } from './ManittoMakerRoster'
import styles from './manittoMakerRoom.module.css'

type RoomState = {
  room: { title: string; note: string; capacity: number; status: 'open' | 'drawn'; expiresAt: string }
  participantCount: number
  isHost: boolean
  hostName?: string
  participants?: RosterPerson[]
  me?: { name: string; recipientName: string | null }
  tokenInvalid?: boolean
}

type ShareDetails = {
  title: string
  url: string
  purpose: 'guest-invite' | 'private-result' | 'room-invite'
}

type MutationResult = { error?: string; token?: string; inviteToken?: string }

function createGuestToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export default function ManittoMakerRoom({ code }: { code: string }) {
  const [state, setState] = useState<RoomState | null>(null)
  const [name, setName] = useState('')
  const [invite, setInvite] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [shareDetails, setShareDetails] = useState<ShareDetails | null>(null)
  const tokenRef = useRef<string | null>(null)
  const refreshRequest = useRef<AbortController | null>(null)
  const mutationInFlight = useRef(false)
  const shareCard = useRef<HTMLElement | null>(null)
  const storageKey = `unblind-manitto-maker:${code}`
  const roomPath = `/manitto/maker/${code}`
  const mission = getManittoMakerMission(code)

  const refresh = useCallback(async (replace = false) => {
    if (refreshRequest.current && !replace) return
    refreshRequest.current?.abort()
    const controller = new AbortController()
    refreshRequest.current = controller
    try {
      const response = await fetch(`/api/manitto/maker/${code}?host=1`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: tokenRef.current ? { [MANITTO_MAKER_TOKEN_HEADER]: tokenRef.current } : undefined,
      })
      const result: RoomState & { error?: string } = await response.json()
      if (!response.ok || !result?.room) throw new Error(result?.error ?? '모임을 불러오지 못했어요.')
      if (result.tokenInvalid && tokenRef.current) {
        tokenRef.current = null
        try { window.localStorage.removeItem(storageKey) } catch { /* optional storage */ }
        setNotice('이 기기의 참여 정보를 찾을 수 없어요. 개인 링크나 참가자 명단을 확인해주세요.')
      }
      if (!controller.signal.aborted) setState(result)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '모임을 불러오지 못했어요.')
    } finally {
      if (refreshRequest.current === controller) refreshRequest.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [code, storageKey])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const privateToken = hash.get('guest')
      const inviteToken = hash.get('invite')
      if (isManittoMakerToken(privateToken)) {
        tokenRef.current = privateToken
        try { window.localStorage.setItem(storageKey, privateToken) } catch { /* optional storage */ }
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
      } else {
        try {
          const stored = window.localStorage.getItem(storageKey)
          if (isManittoMakerToken(stored)) tokenRef.current = stored
        } catch { /* optional storage */ }
      }
      if (isManittoMakerToken(inviteToken)) setInvite(inviteToken)
      void refresh()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      refreshRequest.current?.abort()
      refreshRequest.current = null
    }
  }, [refresh, storageKey])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const timer = window.setInterval(refreshWhenVisible, state?.room.status === 'open' ? 10_000 : 30_000)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [refresh, state?.room.status])

  useEffect(() => {
    if (shareDetails) shareCard.current?.focus()
  }, [shareDetails])

  function keepPrivateToken(token: string) {
    tokenRef.current = token
    try { window.localStorage.setItem(storageKey, token) } catch { /* current visit still works */ }
  }

  async function act(
    body: Record<string, unknown>,
    onResult?: (result: MutationResult) => void,
  ) {
    if (mutationInFlight.current) return false
    mutationInFlight.current = true
    setPending(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/manitto/maker/${code}`, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const result: MutationResult = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error ?? '요청을 처리하지 못했어요.')
      onResult?.(result)
      await refresh(true)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.')
      return false
    } finally {
      mutationInFlight.current = false
      setPending(false)
    }
  }

  async function join(guestName: string) {
    await act({ action: 'join', name: guestName }, (result) => {
      if (!isManittoMakerToken(result.token)) throw new Error('개인 참여 정보를 만들지 못했어요.')
      keepPrivateToken(result.token)
      setName('')
      setNotice('참가했어요. 추첨하면 이 화면에서 내 기도 마니또를 확인할 수 있어요.')
    })
  }

  async function claim() {
    if (!invite) return
    const retryKey = `${storageKey}:claim-retry`
    let guestToken = createGuestToken()
    try {
      const saved = window.sessionStorage.getItem(retryKey)
      if (isManittoMakerToken(saved)) guestToken = saved
      window.sessionStorage.setItem(retryKey, guestToken)
    } catch { /* current attempt still works */ }
    await act({ action: 'claim', inviteToken: invite, guestToken }, () => {
      keepPrivateToken(guestToken)
      try { window.sessionStorage.removeItem(retryKey) } catch { /* optional storage */ }
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
      setInvite(null)
      setNotice('개인 등록을 마쳤어요. 같은 브라우저에서 내 결과를 확인할 수 있어요.')
    })
  }

  async function draw() {
    if (!window.confirm('참가자 명단을 확인했나요? 추첨이 끝나면 명단과 결과를 바꿀 수 없어요.')) return
    await act({ action: 'draw' }, () => setNotice('마니또를 추첨했어요. 개인 초대로 각자 배정 결과를 확인해주세요.'))
  }

  async function add(nameToAdd: string) {
    return act({ action: 'add', name: nameToAdd })
  }

  async function rename(participantId: string, newName: string) {
    return act({ action: 'rename', participantId, name: newName })
  }

  async function remove(person: RosterPerson) {
    if (!window.confirm(`${person.name}님을 명단에서 제외할까요?`)) return
    await act({ action: 'remove', participantId: person.id }, () => {
      setShareDetails(null)
      setNotice(`${person.name}님을 명단에서 제외했어요.`)
    })
  }

  async function prepareInvite(person: RosterPerson) {
    setShareDetails(null)
    await act({ action: 'invite', participantId: person.id }, (result) => {
      if (!isManittoMakerToken(result.inviteToken)) throw new Error('개인 초대를 만들지 못했어요.')
      setShareDetails({
        title: `${person.name}님의 기도 마니또 개인 초대`,
        url: `${window.location.origin}${roomPath}#invite=${result.inviteToken}`,
        purpose: 'guest-invite',
      })
    })
  }

  function preparePrivateLink() {
    if (!tokenRef.current) return
    setShareDetails({
      title: '내 결과 보관 링크',
      url: `${window.location.origin}${roomPath}#guest=${tokenRef.current}`,
      purpose: 'private-result',
    })
  }

  function prepareRoomLink() {
    setShareDetails({
      title: state?.room.title ?? '기도 마니또 초대',
      url: `${window.location.origin}${roomPath}`,
      purpose: 'room-invite',
    })
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setNotice('링크를 복사했어요.')
    } catch {
      setNotice('자동 복사를 할 수 없어요. 아래 주소를 길게 눌러 복사해주세요.')
    }
  }

  async function shareLink(details: ShareDetails) {
    if (navigator.share) {
      try {
        await navigator.share({ title: details.title, url: details.url })
        return
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') return
      }
    }
    await copyLink(details.url)
  }

  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void join(name)
  }

  if (loading && !state) return <p role="status" className={styles.loading}>마니또 모임을 불러오는 중…</p>
  if (!state) return <section className={styles.card}><h2>모임을 열 수 없어요</h2><p className={styles.copy}>{error || '초대 링크를 다시 확인해주세요.'}</p></section>

  const { room, me } = state
  const completed = room.status === 'drawn'
  const hasSpace = state.participantCount < room.capacity
  const participants = state.participants ?? []
  const organizerInRoster = participants.some((person) => person.name.toLowerCase() === state.hostName?.toLowerCase())
  return (
    <div className={styles.layout}>
      <section className={styles.card}>
        <span className={styles.badge}><SystemIcon name="gift" size={14} /> 기도 마니또</span>
        <h2>{room.title}</h2>
        <p className={styles.copy}>한 사람을 위해 기도하고, 말씀과 작은 섬김으로 마음을 전해요.</p>
        {room.note && <p className={styles.note}>{room.note}</p>}
        <div className={styles.roomMeta}>
          <span>{state.participantCount}/{room.capacity}명</span>
          <span>{completed ? '추첨 완료' : '명단 작성 중'}</span>
          <time dateTime={room.expiresAt}>{new Date(room.expiresAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} 만료</time>
        </div>
        {state.isHost && <ol className={styles.steps} aria-label="진행 순서">
          <li>① 모임 설정</li>
          <li aria-current={!completed ? 'step' : undefined}>② 참가자 등록</li>
          <li aria-current={completed ? 'step' : undefined}>③ 비밀 결과</li>
        </ol>}
      </section>

      {(notice || error) && <div className={styles.feedback}>
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
      </div>}

      {state.isHost && (
        <section className={styles.card} aria-label="방장 관리">
          <ManittoMakerRoster people={participants} completed={completed} pending={pending} hasSpace={hasSpace}
            add={add} rename={rename} remove={remove} prepareInvite={prepareInvite} />
          {!me && !completed && hasSpace && state.hostName && !organizerInRoster && (
            <button type="button" onClick={() => void join(state.hostName!)} disabled={pending} className={styles.secondary}>
              {state.hostName}님도 참가하기
            </button>
          )}
          {!completed && (
            <div className={styles.hostActions}>
              <button type="button" className={styles.secondary} onClick={prepareRoomLink}>공통 입장 링크</button>
              <button type="button" className={styles.primary} disabled={pending || state.participantCount < MANITTO_MAKER_MIN_MEMBERS}
                onClick={() => void draw()}>{pending ? '처리 중…' : '마니또 추첨하기'}</button>
            </div>
          )}
          <p className={styles.hint}>{completed ? '명단에 직접 추가한 참가자에게 각자의 개인 초대를 보내주세요.' : '방장도 참가할 수 있어요. 2명 이상 모이면 추첨할 수 있고, 추첨 후에는 명단이 잠깁니다.'}</p>
        </section>
      )}

      {me ? (
        <section className={styles.card}>
          <h3>{me.name}님의 기도 마니또</h3>
          {completed && me.recipientName ? (
            <>
              {revealed && (
                <div className={styles.privateResult} role="status">
                  <span>내가 기억하고 기도할 사람</span>
                  <strong>{me.recipientName}</strong>
                  <div className={styles.mission}><b>{mission.title}</b><p>{mission.description}</p></div>
                </div>
              )}
              <button type="button" className={revealed ? styles.secondary : styles.primary} onClick={() => setRevealed(!revealed)}>
                {revealed ? '결과 가리기' : '나만의 마니또 열어보기'}
              </button>
            </>
          ) : <p className={styles.copy}>{completed ? '결과를 불러오는 중이에요. 잠시 뒤 다시 확인해주세요.' : '추첨하면 여기서 나만의 기도 마니또를 열어볼 수 있어요.'}</p>}
          <button type="button" className={styles.secondary} onClick={preparePrivateLink}>내 비밀 확인 링크 보관</button>
        </section>
      ) : invite ? (
        <section className={styles.card}>
          <h3>개인 초대가 도착했어요</h3>
          <p className={styles.copy}>이 기기에서 한 번만 등록할 수 있어요. 등록을 마치면 내 결과 보관 링크를 만들 수 있어요.</p>
          <button type="button" className={styles.primary} onClick={() => void claim()} disabled={pending}>{pending ? '등록 중…' : '내 참가 자리 등록하기'}</button>
        </section>
      ) : !state.isHost && !completed ? (
        <section className={styles.card}>
          <h3>모임에 입장하기</h3>
          <p className={styles.copy}>방장이 이미 내 이름을 넣었다면 방장에게 개인 초대를 요청해주세요.</p>
          <form onSubmit={submitJoin} className={styles.joinForm}>
            <label>참가할 이름<input required maxLength={24} value={name} onChange={(event) => setName(event.target.value)} placeholder="모임에서 사용할 이름" /></label>
            <button type="submit" className={styles.primary} disabled={pending || !hasSpace || !name.trim()}>{!hasSpace ? '모집 인원 마감' : pending ? '입장 중…' : '이름으로 참가하기'}</button>
          </form>
        </section>
      ) : !state.isHost && (
        <section className={styles.card}><h3>추첨이 완료됐어요</h3><p className={styles.copy}>방장에게 받은 개인 초대 또는 이전에 보관한 내 비밀 확인 링크로 열어주세요.</p></section>
      )}

      {shareDetails && (
        <section ref={shareCard} tabIndex={-1} className={styles.card} aria-label={shareDetails.title}>
          <div className={styles.shareHeading}><h3>{shareDetails.title}</h3>
            <button type="button" aria-label="링크 카드 닫기" className={styles.iconButton} onClick={() => setShareDetails(null)}><SystemIcon name="close" size={18} /></button>
          </div>
          <p className={styles.copy}>{shareDetails.purpose === 'private-result'
            ? '다른 기기에 옮길 때만 사용하세요. 이 링크를 가진 사람은 내 결과를 볼 수 있어요.'
            : shareDetails.purpose === 'guest-invite'
              ? '이 참가자에게만 카카오톡 등으로 보내주세요. 본인이 한 번 등록하면 이 초대는 다시 열리지 않아요.'
              : '명단에 없는 사람이 직접 참가할 수 있는 링크예요. 우리 모임에만 공유해주세요.'}</p>
          <input aria-label="복사할 링크" readOnly value={shareDetails.url} onFocus={(event) => event.target.select()} className={styles.shareInput} />
          <div className={styles.hostActions}>
            <button type="button" className={styles.secondary} onClick={() => void copyLink(shareDetails.url)}>링크 복사</button>
            {shareDetails.purpose !== 'private-result' && <button type="button" className={styles.primary} onClick={() => void shareLink(shareDetails)}>공유하기</button>}
          </div>
        </section>
      )}
    </div>
  )
}
