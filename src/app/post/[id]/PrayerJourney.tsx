'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import {
  prayerStageLabels,
  prayerStageOrder,
  type PrayerStage,
} from '@/lib/prayerJourney'

const nextStageCopy: Partial<Record<PrayerStage, string>> = {
  requested: '함께 기도 중으로',
  praying: '응답 완료로',
  answered: '주님께 감사로',
}

export default function PrayerJourney({
  postId,
  initialStage,
  urgent,
  canManage,
}: {
  postId: string
  initialStage: PrayerStage
  urgent: boolean
  canManage: boolean
}) {
  const router = useRouter()
  const [stage, setStage] = useState(initialStage)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const activeIndex = prayerStageOrder.indexOf(stage)
  const nextStage = prayerStageOrder[activeIndex + 1]

  async function advance() {
    if (!nextStage || saving) return
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/prayer-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, stage: nextStage }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '기도여정을 변경하지 못했습니다.')
      setStage(nextStage)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '기도여정을 변경하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-5 rounded-[18px] border border-[var(--ub-separator)] bg-[var(--ub-surface-muted)] p-4" aria-labelledby="prayer-journey-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-[var(--ub-color-brand)]">PRAYER JOURNEY</p>
          <h2 id="prayer-journey-title" className="mt-0.5 text-[16px] font-extrabold text-[var(--ub-text-primary)]">기도여정</h2>
        </div>
        <span className="rounded-full bg-[var(--ub-surface-card-strong)] px-3 py-1 text-[11px] font-bold text-[var(--ub-color-brand)]">
          {prayerStageLabels[stage]}
        </span>
      </div>

      <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="기도여정 진행 상태">
        {prayerStageOrder.map((item, index) => {
          const completed = index <= activeIndex
          return (
            <li key={item} className="min-w-0 text-center">
              <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${
                completed
                  ? 'border-[var(--ub-color-brand)] bg-[var(--ub-color-brand)] text-white'
                  : 'border-[var(--ub-separator)] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-tertiary)]'
              }`}>
                {completed ? <SystemIcon name="check" size={14} /> : index + 1}
              </span>
              <span className={`mt-1.5 block break-keep text-[10px] leading-[14px] ${
                completed ? 'font-bold text-[var(--ub-text-primary)]' : 'text-[var(--ub-text-tertiary)]'
              }`}>
                {prayerStageLabels[item]}
              </span>
            </li>
          )
        })}
      </ol>

      {urgent && (
        <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-[var(--ub-danger-soft)] px-3 py-2 text-[12px] font-bold text-[var(--ub-danger-text)]">
          <span aria-hidden>🚨</span>
          긴급 중보요청으로 시작된 기도입니다.
        </div>
      )}

      {canManage && nextStage && (
        <button
          type="button"
          onClick={advance}
          disabled={saving}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-[13px] bg-[var(--ub-color-brand)] px-4 text-[13px] font-bold text-white disabled:opacity-55"
        >
          {saving ? '변경 중…' : `${nextStageCopy[stage]} 변경`}
        </button>
      )}
      {canManage && !nextStage && (
        <p className="mt-3 text-center text-[12px] font-semibold text-[var(--ub-text-secondary)]">
          감사로 마무리된 기도여정입니다.
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-[var(--ub-danger-text)]" role="alert">{error}</p>}
    </section>
  )
}
