'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type ManittoClientProps = {
  weekKey: string
  startsOn: string
  endsOn: string
  participantCount: number
  recipientNickname: string | null
  joined: boolean
  isActive: boolean
  revealEnabled: boolean
  receivedMessages: { id: string; body: string; createdAt: string }[]
}

const missions = [
  '마니또의 이름을 부르며 1분 동안 기도하기',
  '마니또가 오늘 평안을 누리도록 축복하기',
  '공동체 게시글에 따뜻한 댓글 하나 남기기',
  '마니또의 예배와 신앙생활을 위해 기도하기',
  '마니또의 건강과 일상을 위해 기도하기',
]

export default function ManittoClient({
  weekKey,
  startsOn,
  endsOn,
  participantCount,
  recipientNickname,
  joined,
  isActive,
  revealEnabled,
  receivedMessages,
}: ManittoClientProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const storageKey = `unblind-manitto:${weekKey}:${recipientNickname ?? 'waiting'}`
  const [completedMissions, setCompletedMissions] = useState<number[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey)

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setCompletedMissions(
              parsed.filter((value): value is number =>
                Number.isInteger(value) && value >= 0 && value < missions.length
              )
            )
          }
        } catch {
          window.localStorage.removeItem(storageKey)
        }
      }

      setIsReady(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [storageKey])

  const completedSet = useMemo(
    () => new Set(completedMissions),
    [completedMissions]
  )

  function toggleMission(index: number) {
    const next = completedSet.has(index)
      ? completedMissions.filter((missionIndex) => missionIndex !== index)
      : [...completedMissions, index].sort((a, b) => a - b)

    setCompletedMissions(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
  }

  async function runAction(action: 'join' | 'leave' | 'message', event?: FormEvent) {
    event?.preventDefault()
    setSubmitting(true)
    setServerMessage('')
    const response = await fetch('/api/manitto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, message }),
    })
    const result = await response.json()
    setSubmitting(false)
    if (!response.ok) {
      setServerMessage(result.error ?? '요청을 처리하지 못했습니다.')
      return
    }
    if (action === 'message') {
      setMessage('')
      setServerMessage('익명 응원 쪽지를 보냈습니다.')
    }
    router.refresh()
  }

  if (!isActive) {
    return <section className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-6 text-center text-[var(--ub-text-primary)]"><h2 className="text-[18px] font-semibold">지금은 마니또 운영 기간이 아닙니다</h2><p className="mt-2 text-[14px] text-[var(--ub-text-secondary)]">운영자가 다음 기간을 열면 참여할 수 있어요.</p></section>
  }

  if (!joined) {
    return <section className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-6 text-center text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]"><SystemIcon name="gift" size={26} /></span><h2 className="mt-4 text-[18px] font-semibold">마니또에 참여할까요?</h2><p className="mt-2 text-[14px] leading-[21px] text-[var(--ub-text-secondary)]">참여하면 매주 한 명을 배정받아 익명으로 기도하고 응원할 수 있습니다.</p><button type="button" disabled={submitting} onClick={() => runAction('join')} className="mt-5 min-h-12 w-full rounded-[16px] bg-[var(--ub-color-brand)] font-semibold text-white disabled:opacity-50">참여하기</button>{serverMessage && <p className="mt-3 text-[13px] text-[#FF3B30]">{serverMessage}</p>}</section>
  }

  if (!recipientNickname) {
    return (
      <section className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-6 text-center text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
          <SystemIcon name="people" size={26} />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold">마니또를 기다리고 있어요</h2>
        <p className="mt-2 text-[14px] leading-[21px] text-[var(--ub-text-secondary)]">
          가입과 승인을 완료한 사용자가 2명 이상이면 자동으로 배정됩니다.
          현재 참여 가능 인원은 {participantCount}명입니다.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)]">
        <div className="bg-[var(--ub-surface-brand-soft)] px-5 py-4 text-center">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-[var(--ub-color-brand)]">
            {startsOn} — {endsOn}
          </p>
          <span className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-white shadow-sm">
            <SystemIcon name="gift" size={27} />
          </span>
          <p className="mt-4 text-[13px] text-[var(--ub-text-secondary)]">이번 주 당신의 마니또</p>
          <h2 className="mt-1 text-[26px] font-bold tracking-[-0.5px]">{recipientNickname}</h2>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-[14px] leading-[21px] text-[var(--ub-text-secondary)]">
            정체를 알아내려 하기보다, 닉네임을 기억하며 조용히 기도하고 응원해주세요.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between px-1">
          <div>
            <p className="text-[14px] font-semibold text-[var(--ub-text-on-brand-primary)]">이번 주 미션</p>
            <p className="mt-0.5 text-[11px] text-[var(--ub-text-on-brand-tertiary)]">완료 기록은 이 기기에만 저장됩니다.</p>
          </div>
          <span className="text-[12px] font-semibold text-[var(--ub-text-on-brand-primary)]">
            {isReady ? completedMissions.length : 0}/{missions.length}
          </span>
        </div>

        <div className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
          {missions.map((mission, index) => {
            const isCompleted = isReady && completedSet.has(index)

            return (
              <button
                key={mission}
                type="button"
                onClick={() => toggleMission(index)}
                className="flex min-h-[64px] w-full items-center gap-3 border-b border-[var(--ub-separator)] px-4 py-3 text-left last:border-b-0 active:bg-[var(--ub-surface-pressed)]"
              >
                <span
                  className={
                    isCompleted
                      ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-[15px] font-bold text-white'
                      : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--ub-separator)] text-[12px] text-[var(--ub-text-tertiary)]'
                  }
                >
                  {isCompleted ? '✓' : index + 1}
                </span>
                <span className={isCompleted ? 'text-[14px] text-[var(--ub-text-tertiary)] line-through' : 'text-[14px] text-[var(--ub-text-primary)]'}>
                  {mission}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-[20px] bg-[var(--ub-surface-card-strong)] p-4 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
        <h3 className="text-[15px] font-semibold">익명 응원 쪽지</h3>
        <form onSubmit={(event) => runAction('message', event)} className="mt-3">
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} rows={3} placeholder="마니또에게 따뜻한 응원을 남겨주세요." className="min-h-[88px] w-full resize-none rounded-[16px] bg-[var(--ub-surface-muted)] px-4 py-3 text-[14px] outline-none" />
          <button type="submit" disabled={submitting || message.trim().length < 2} className="mt-2 min-h-11 w-full rounded-[14px] bg-[var(--ub-color-brand)] text-[14px] font-semibold text-white disabled:opacity-50">익명으로 보내기</button>
        </form>
        {serverMessage && <p className="mt-2 text-[12px] text-[var(--ub-color-brand)]">{serverMessage}</p>}
      </section>

      <section>
        <p className="mb-2 px-1 text-[13px] font-semibold text-[var(--ub-text-on-brand-primary)]">받은 익명 쪽지</p>
        <div className="space-y-2">
          {receivedMessages.map((item) => <div key={item.id} className="rounded-[18px] bg-[var(--ub-surface-card-strong)] p-4 text-[14px] leading-[21px] text-[var(--ub-text-primary)]"><p>{item.body}</p><time className="mt-2 block text-[11px] text-[var(--ub-text-tertiary)]">{new Date(item.createdAt).toLocaleString('ko-KR')}</time></div>)}
          {receivedMessages.length === 0 && <p className="rounded-[18px] bg-[var(--ub-surface-card)] p-4 text-center text-[13px] text-[var(--ub-text-secondary)]">아직 받은 쪽지가 없습니다.</p>}
        </div>
      </section>

      <div className="rounded-[18px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-4 text-[13px] leading-[20px] text-[var(--ub-text-secondary)] backdrop-blur-xl">
        매주 월요일에 새로운 마니또가 자동으로 배정됩니다. 이메일·실명·교회 정보는 서로에게 공개되지 않습니다.{revealEnabled ? ' 이번 운영은 종료 후 정체 공개가 허용됩니다.' : ''}
      </div>
      <button type="button" onClick={() => runAction('leave')} disabled={submitting} className="min-h-11 w-full text-[12px] text-[var(--ub-text-on-brand-tertiary)]">마니또 참여 중단</button>
    </div>
  )
}
