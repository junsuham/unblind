'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getHomeManittoPhase,
  type HomeManittoState,
} from '@/lib/homeManitto'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type ManittoResponse = HomeManittoState & {
  error?: string
}

type HomeManittoFinderProps = {
  initialState: HomeManittoState
}

function getPhaseCopy(state: HomeManittoState) {
  const phase = getHomeManittoPhase(state)

  if (phase === 'inactive') return '다음 운영을 기다려주세요'
  if (phase === 'waiting') return `찾는 중 · 현재 ${state.participantCount}명`
  if (phase === 'matched') return '마니또를 찾았어요'
  return '한 주의 마니또를 찾아보세요'
}

export function HomeManittoFinder({
  initialState,
}: HomeManittoFinderProps) {
  const router = useRouter()
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
        setError(result.error ?? '마니또 찾기를 시작하지 못했습니다.')
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

  return (
    <>
      <button
        type="button"
        disabled={phase === 'inactive' || submitting}
        onClick={startFinding}
        className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left text-[var(--ub-text-primary)] active:bg-[var(--ub-surface-pressed)] disabled:opacity-60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
          <SystemIcon name="gift" size={21} filled={phase === 'matched'} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold tracking-[-0.2px]">
            마니또 찾기
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[var(--ub-text-secondary)]">
            {error || getPhaseCopy(state)}
          </span>
        </span>
        {submitting || phase === 'waiting' ? (
          <span
            aria-label={submitting ? '마니또 찾기 시작 중' : '마니또 찾는 중'}
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--ub-separator)] border-t-[var(--ub-color-brand)]"
          />
        ) : (
          <span className="text-[22px] leading-none text-[var(--ub-text-tertiary)]" aria-hidden>
            ›
          </span>
        )}
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
            className="ub-manitto-dialog w-full max-w-[340px] rounded-[28px] bg-[var(--ub-surface-card-strong)] p-5 text-center text-[var(--ub-text-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
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

