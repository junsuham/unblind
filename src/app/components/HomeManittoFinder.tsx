'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getHomeManittoPhase,
  type HomeManittoState,
} from '@/lib/homeManitto'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { HomeAppTileContent, homeAppTileClassName } from '@/app/components/HomeAppTile'

type ManittoResponse = HomeManittoState & {
  error?: string
}

type HomeManittoFinderProps = {
  initialState: HomeManittoState
}

function getPhaseCopy(state: HomeManittoState) {
  const phase = getHomeManittoPhase(state)

  if (phase === 'inactive') return '다음 주간 모임을 기다려주세요'
  if (phase === 'waiting') return `참여 완료 · ${state.participantCount}명과 함께 기다리는 중`
  if (phase === 'matched') return '이번 주 마니또가 배정됐어요'
  return '참여하고 익명 응원 카드를 만들어보세요'
}

export function HomeManittoFinder({
  initialState,
}: HomeManittoFinderProps) {
  const router = useRouter()
  const descriptionId = useId()
  const [state, setState] = useState(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')
  const stateRef = useRef(state)
  const phase = getHomeManittoPhase(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    router.prefetch('/manitto')
  }, [router])

  const refreshMatch = useCallback(async () => {
    const response = await fetch('/api/manitto', { cache: 'no-store' })
    if (!response.ok) return

    const nextState = await response.json() as ManittoResponse
    const wasMatched = Boolean(stateRef.current.recipientNickname)
    stateRef.current = nextState
    setState(nextState)

    if (!wasMatched && nextState.recipientNickname) {
      setDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'waiting') return

    const timer = window.setInterval(() => {
      void refreshMatch()
    }, 12_000)

    return () => window.clearInterval(timer)
  }, [phase, refreshMatch])

  async function startFinding() {
    if (phase === 'inactive') return
    if (phase === 'matched') {
      setDialogOpen(true)
      return
    }
    if (phase === 'waiting') {
      await refreshMatch()
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/manitto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'find' }),
      })
      const result = await response.json() as {
        error?: string
        manitto?: ManittoResponse
      }

      if (!response.ok || !result.manitto) {
        setError(result.error ?? '마니또 참여를 시작하지 못했습니다.')
        return
      }

      stateRef.current = result.manitto
      setState(result.manitto)
      if (result.manitto.recipientNickname) setDialogOpen(true)
    } catch {
      setError('네트워크 연결을 확인한 뒤 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const status = error || (submitting ? '참여 중'
    : phase === 'waiting' ? `대기 중 · ${state.participantCount}명`
    : phase === 'matched' ? '배정 완료'
    : phase === 'inactive' ? '다음 주 모임'
    : undefined)

  return (
    <>
      <button
        type="button"
        disabled={phase === 'inactive' || submitting}
        onClick={startFinding}
        aria-label="마니또 메이커"
        aria-describedby={descriptionId}
        aria-busy={submitting}
        aria-haspopup={phase === 'matched' ? 'dialog' : undefined}
        className={homeAppTileClassName}
      >
        <HomeAppTileContent
          label="마니또 메이커"
          kind="manitto"
          status={status}
          error={Boolean(error)}
          badge={submitting || phase === 'waiting' ? 'waiting' : phase === 'matched' ? 'matched' : undefined}
        />
        <span id={descriptionId} className="sr-only">
          {error || (submitting ? '마니또 참여 시작 중' : getPhaseCopy(state))}
        </span>
      </button>

      {dialogOpen && (
        <div
          role="presentation"
          className="ub-manitto-dialog-backdrop fixed inset-0 z-[95] flex items-center justify-center bg-black/46 px-6 backdrop-blur-sm"
          onClick={() => setDialogOpen(false)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="manitto-match-title"
            className="ub-manitto-dialog ub-liquid-card w-full max-w-[340px] p-5 text-center text-[var(--ub-text-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
              <SystemIcon name="gift" size={28} filled />
            </span>
            <h2 id="manitto-match-title" className="mt-4 text-[20px] font-bold tracking-[-0.4px]">
              마니또를 찾았어요
            </h2>
            <p className="mt-2 text-[13px] leading-[20px] text-[var(--ub-text-secondary)]">
              {state.recipientNickname
                ? `${state.recipientNickname}님을 위해 이번 주 활동을 시작해보세요.`
                : '이번 주 마니또 활동을 시작해보세요.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/manitto')}
              className="mt-5 min-h-12 w-full rounded-[16px] bg-[var(--ub-color-brand)] text-[15px] font-bold text-white active:scale-[0.99]"
            >
              활동 시작
            </button>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="mt-1 min-h-11 w-full text-[13px] font-semibold text-[var(--ub-text-secondary)]"
            >
              나중에
            </button>
          </section>
        </div>
      )}
    </>
  )
}
