'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  parsePrayerRoomMessage, prayerRoomLiveVersion, prayerRoomMessageLimit, type PrayerRoomPosition, type PrayerRoomSnapshot,
} from '@/lib/prayerRoomLive'
import styles from './PrayerRoomLive.module.css'

const emptyRoom: PrayerRoomSnapshot = { peers: [], messages: [], chatSent: false }
const exchangeUrl = '/api/prayer-room/live'
const pollInterval = 3200
type ExchangeResult = { response: Response; data: PrayerRoomSnapshot & { error?: string } }

export function usePrayerRoomLive() {
  const [joined, setJoined] = useState(true)
  const [snapshot, setSnapshot] = useState(emptyRoom)
  const [status, setStatus] = useState<'connecting' | 'ready' | 'retry' | 'unavailable'>('connecting')
  const position = useRef<PrayerRoomPosition | null>(null)
  const active = useRef(false)
  const visit = useRef<string | null>(null)
  const busy = useRef<{ visitId: string; pending: Promise<ExchangeResult> } | null>(null)
  const retryAt = useRef(0)

  const exchange = useCallback(async (chat?: string) => {
    if (!active.current || !position.current || document.visibilityState !== 'visible' || Date.now() < retryAt.current) return false
    const visitId = visit.current ?? crypto.randomUUID()
    visit.current = visitId
    if (busy.current?.visitId === visitId) {
      if (!chat) return false
      await busy.current.pending.catch(() => undefined)
    }
    if (!active.current || visit.current !== visitId || busy.current?.visitId === visitId || Date.now() < retryAt.current) return false
    const current = fetch(exchangeUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomVersion: prayerRoomLiveVersion, visitId, position: position.current, ...(chat ? { chat } : {}) }),
      signal: AbortSignal.timeout(7000),
    }).then(async (response): Promise<ExchangeResult> => ({
      response,
      data: await response.json(),
    }))
    busy.current = { visitId, pending: current }
    try {
      const { response, data } = await current
      if (!active.current || visit.current !== visitId) return false
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setStatus('unavailable')
          retryAt.current = Infinity
        } else {
          const retryAfter = Number(response.headers.get('Retry-After'))
          if (retryAfter > 0) retryAt.current = Date.now() + retryAfter * 1000
        }
        throw new Error(data.error ?? '기도의 방 연결을 다시 시도하고 있어요.')
      }
      setSnapshot(data)
      setStatus('ready')
      if (chat && !data.chatSent) throw new Error('채팅은 4초에 한 번 보낼 수 있어요.')
      return Boolean(chat)
    } catch (error) {
      if (chat) throw error
      if (active.current && visit.current === visitId) setStatus((value) => value === 'unavailable' ? value : 'retry')
      return false
    } finally {
      if (busy.current?.pending === current) busy.current = null
    }
  }, [])

  const updatePosition = useCallback((value: PrayerRoomPosition) => {
    position.current = value
    if (!visit.current && active.current && document.visibilityState === 'visible') void exchange()
  }, [exchange])

  const clearPresence = useCallback(() => {
    active.current = false
    const visitId = visit.current
    visit.current = null
    if (!visitId) return
    const sendLeave = () => {
      void fetch(exchangeUrl, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomVersion: prayerRoomLiveVersion, visitId, leave: true }),
      }).catch(() => undefined)
    }
    const pending = busy.current
    if (pending?.visitId === visitId) void pending.pending.then(sendLeave, sendLeave)
    else sendLeave()
  }, [])

  const enter = useCallback(() => {
    retryAt.current = 0
    setStatus('connecting')
    setJoined(true)
  }, [])

  const leave = useCallback(() => {
    clearPresence()
    setJoined(false)
    setSnapshot(emptyRoom)
  }, [clearPresence])

  useEffect(() => {
    if (!joined) return
    active.current = true
    const poll = () => {
      if (document.visibilityState === 'visible') void exchange()
    }
    const restore = () => {
      active.current = true
      poll()
    }
    poll()
    const timer = window.setInterval(poll, pollInterval)
    document.addEventListener('visibilitychange', poll)
    window.addEventListener('pageshow', restore)
    window.addEventListener('pagehide', clearPresence)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
      window.removeEventListener('pageshow', restore)
      window.removeEventListener('pagehide', clearPresence)
      clearPresence()
    }
  }, [joined, exchange, clearPresence])

  return { joined, status, peers: snapshot.peers, messages: snapshot.messages, updatePosition, enter, leave, send: exchange }
}

export function PrayerRoomChat({ live }: { live: ReturnType<typeof usePrayerRoomLive> }) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const thread = useRef<HTMLUListElement>(null)
  const pinned = useRef(true)
  const hint = useId()
  const lastMessage = live.messages.at(-1)?.id

  useEffect(() => {
    if (pinned.current && thread.current) thread.current.scrollTop = thread.current.scrollHeight
  }, [lastMessage])

  if (!live.joined) {
    return (
      <section aria-label="기도의 방 혼자 하기" className={styles.lobby}>
        <div>
          <strong>혼자 오르는 중</strong>
          <p>함께 입장하면 같은 방의 회원에게 닉네임과 캐릭터가 보여요.</p>
        </div>
        <button type="button" onClick={() => { setNotice(''); live.enter() }}>함께 입장</button>
      </section>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    const text = parsePrayerRoomMessage(draft)
    if (!text) { setNotice('160자 이내로 입력하고 연락처와 링크는 빼주세요.'); return }
    setSending(true)
    setNotice('')
    try {
      if (!await live.send(text)) throw new Error('연결이 바쁩니다. 잠시 후 다시 보내주세요.')
      pinned.current = true
      if (thread.current) thread.current.scrollTop = thread.current.scrollHeight
      setDraft('')
    } catch (error) {
      setNotice(error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError' ? error.message : '전송되지 않았어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

  const connection = live.status === 'ready' ? `함께 있는 사람 ${live.peers.length + 1}명`
    : live.status === 'unavailable' ? '현재 입장할 수 없어요'
      : live.status === 'retry' ? '다시 연결하는 중…' : '방에 연결하는 중…'

  return (
    <section aria-label="기도의 방 채팅" className={styles.chat}>
      <div className={styles.toolbar}>
        <div>
          <strong>채팅 <span className={styles.connection} role="status">{connection}</span></strong>
          <p className={styles.privacy}>이 방의 회원에게 닉네임과 캐릭터가 보여요.</p>
        </div>
        <button type="button" onClick={() => { setDraft(''); setNotice(''); live.leave() }}>혼자 하기</button>
      </div>
      <ul
        ref={thread}
        aria-label="최근 대화"
        className={styles.thread}
        onScroll={(event) => {
          const e = event.currentTarget
          pinned.current = e.scrollHeight - e.scrollTop - e.clientHeight < 28
        }}
      >
        {live.messages.length ? live.messages.map(({ id, nickname, text }) => (
          <li key={id}><b>{nickname}</b><span>{text}</span></li>
        )) : <li className={styles.placeholder}>가벼운 인사나 응원으로 대화를 시작해 보세요.</li>}
      </ul>
      <form onSubmit={submit} className={styles.compose}>
        <input
          aria-label="보낼 채팅 메시지"
          aria-describedby={hint}
          value={draft}
          maxLength={prayerRoomMessageLimit}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="응원 메시지 쓰기"
          enterKeyHint="send"
        />
        <button type="submit" disabled={live.status !== 'ready' || sending || !draft.trim()}>보내기</button>
      </form>
      <p id={hint} className={styles.hint}>최근 15분 대화만 보입니다. 개인 정보는 쓰지 마세요. <Link href="/support">신고·문의</Link></p>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
    </section>
  )
}
