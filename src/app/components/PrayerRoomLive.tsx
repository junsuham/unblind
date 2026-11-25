'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const pinned = useRef(true)
  const hint = useId()
  const lastMessage = live.messages.at(-1)?.id

  useEffect(() => {
    if (pinned.current && thread.current) thread.current.scrollTop = thread.current.scrollHeight
  }, [lastMessage])

  useEffect(() => {
    const input = inputRef.current
    const frame = input?.closest<HTMLElement>('.ub-app-frame')
    const viewport = window.visualViewport
    if (!input || !frame || !viewport) return
    let normalHeight = viewport.height
    let resetTimer = 0

    const reset = () => {
      window.clearTimeout(resetTimer)
      frame.removeAttribute('data-prayer-keyboard')
      frame.style.removeProperty('--prayer-visible-height')
      frame.style.removeProperty('--prayer-visible-top')
    }

    const sync = () => {
      const focused = document.activeElement === input
      if (!focused) {
        if (frame.hasAttribute('data-prayer-keyboard') && normalHeight - viewport.height > 72) {
          // Wait for the keyboard transition before moving nearby tap targets.
          window.clearTimeout(resetTimer)
          resetTimer = window.setTimeout(reset, 280)
        } else {
          normalHeight = viewport.height
          reset()
        }
      } else if (viewport.scale <= 1.05 && Math.max(normalHeight, window.innerHeight) - viewport.height > 72) {
        window.clearTimeout(resetTimer)
        frame.style.setProperty('--prayer-visible-height', `${viewport.height}px`)
        frame.style.setProperty('--prayer-visible-top', `${viewport.offsetTop}px`)
        frame.setAttribute('data-prayer-keyboard', '')
      } else reset()
    }

    input.addEventListener('focus', sync)
    input.addEventListener('blur', sync)
    viewport.addEventListener('resize', sync)
    viewport.addEventListener('scroll', sync)
    return () => {
      input.removeEventListener('focus', sync)
      input.removeEventListener('blur', sync)
      viewport.removeEventListener('resize', sync)
      viewport.removeEventListener('scroll', sync)
      reset()
    }
  }, [live.joined])

  if (!live.joined) return null

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
      <ul
        ref={thread}
        hidden={!live.messages.length}
        aria-label="최근 대화"
        className={styles.thread}
        onScroll={(event) => {
          const e = event.currentTarget
          pinned.current = e.scrollHeight - e.scrollTop - e.clientHeight < 28
        }}
      >
        {live.messages.map(({ id, nickname, text }) => (
          <li key={id}><b>{nickname}</b><span>{text}</span></li>
        ))}
      </ul>
      <form onSubmit={submit} className={styles.compose}>
        <div className={styles.field}>
          <span className={styles.fieldIcon} aria-hidden="true">
            <SystemIcon name="message" size={18} />
            <span className={styles.connectionDot} data-state={live.status} />
          </span>
          <input
            ref={inputRef}
            aria-label="보낼 채팅 메시지"
            aria-describedby={hint}
            value={draft}
            maxLength={prayerRoomMessageLimit}
            onChange={(event) => setDraft(event.target.value)}
            enterKeyHint="send"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          aria-label="채팅 보내기"
          disabled={live.status !== 'ready' || sending || !draft.trim()}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M21.3 3.1a1 1 0 0 1 1 1.2l-3.7 15.3a1 1 0 0 1-1.5.6l-5.4-3.5-2.5 2.6a.7.7 0 0 1-1.1-.5v-4.3l9-8.2-10.2 6.8-4.1-1.6a1 1 0 0 1 0-1.9l18-6.4Z" />
          </svg>
        </button>
        <Link href="/support" aria-label="신고·문의" title="신고·문의" className={styles.report}>
          <SystemIcon name="flag" size={17} />
        </Link>
      </form>
      <span role="status" className="sr-only">{connection}</span>
      <p id={hint} className="sr-only">함께 있는 회원에게 닉네임과 캐릭터가 보여요. 최근 15분 대화만 보입니다. 개인 정보는 쓰지 마세요.</p>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
    </section>
  )
}
