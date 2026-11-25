'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  parsePrayerRoomMessage, prayerRoomMessageLimit, type PrayerRoomPosition, type PrayerRoomSnapshot,
} from '@/lib/prayerRoomLive'
import styles from './PrayerRoomLive.module.css'

const emptyRoom: PrayerRoomSnapshot = { peers: [], messages: [], chatSent: false }
const exchangeUrl = '/api/prayer-room/live'

export function usePrayerRoomLive() {
  const [joined, setJoined] = useState(false)
  const [snapshot, setSnapshot] = useState(emptyRoom)
  const [status, setStatus] = useState<'connecting' | 'ready' | 'retry' | 'unavailable'>('connecting')
  const position = useRef<PrayerRoomPosition | null>(null)
  const active = useRef(false)
  const busy = useRef<Promise<PrayerRoomSnapshot> | null>(null)

  const updatePosition = useCallback((value: PrayerRoomPosition) => { position.current = value }, [])
  const exchange = useCallback(async (chat?: string) => {
    if (!active.current || !position.current) return false
    if (busy.current) {
      if (!chat) return false
      await busy.current.catch(() => undefined)
    }
    if (!active.current || busy.current) return false
    const current = fetch(exchangeUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: position.current, ...(chat ? { chat } : {}) }),
      signal: AbortSignal.timeout(7000),
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) setStatus('unavailable')
        throw new Error(data.error ?? '기도의 방 연결을 다시 시도하고 있어요.')
      }
      return data as PrayerRoomSnapshot
    })
    busy.current = current
    try {
      const newRoom = await current
      if (!active.current) return false
      setSnapshot(newRoom)
      setStatus('ready')
      if (chat && !newRoom.chatSent) throw new Error('채팅은 4초에 한 번 보낼 수 있어요.')
      return Boolean(chat)
    } catch (error) {
      if (chat) throw error
      if (active.current) setStatus((value) => value === 'unavailable' ? value : 'retry')
      return false
    } finally {
      if (busy.current === current) busy.current = null
    }
  }, [])

  const enter = useCallback(() => {
    active.current = true
    setStatus('connecting')
    setJoined(true)
  }, [])

  const leave = useCallback(() => {
    active.current = false
    setJoined(false)
    setSnapshot(emptyRoom)
    const sendLeave = () => {
      if (active.current) return
      void fetch(exchangeUrl, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave: true }),
      }).catch(() => undefined)
    }
    if (busy.current) void busy.current.then(sendLeave, sendLeave)
    else sendLeave()
  }, [])

  useEffect(() => {
    if (!joined) return
    const poll = () => {
      if (document.visibilityState === 'visible') void exchange()
    }
    poll()
    const timer = window.setInterval(poll, 3200)
    document.addEventListener('visibilitychange', poll)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [joined, exchange])

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
      <section aria-label="함께 입장" className={styles.lobby}>
        <div>
          <strong>함께 오르기</strong>
          <p>입장하면 같은 방의 회원에게 앱 닉네임과 캐릭터가 보입니다.</p>
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
        <strong>{connection}</strong>
        <button type="button" onClick={() => { setDraft(''); setNotice(''); live.leave() }}>나가기</button>
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
