'use client'

import { useEffect, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type ReactionType = 'pray' | 'empathize'

type ReactionButtonsProps = {
  postId: string
  initialPrayCount: number
  initialEmpathizeCount: number
  commentCount: number
}

export default function ReactionButtons({
  postId,
  initialPrayCount,
  initialEmpathizeCount,
  commentCount,
}: ReactionButtonsProps) {
  const [counts, setCounts] = useState({
    pray: initialPrayCount,
    empathize: initialEmpathizeCount,
  })

  const [clicked, setClicked] = useState<Record<ReactionType, boolean>>({
    pray: false,
    empathize: false,
  })

  const [isLoadingMyReactions, setIsLoadingMyReactions] = useState(true)
  const [submittingType, setSubmittingType] = useState<ReactionType | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadMyReactions() {
      try {
        const response = await fetch(`/api/reactions?postId=${encodeURIComponent(postId)}`)
        const result = await response.json().catch(() => null)
        const types = response.ok && Array.isArray(result?.types) ? result.types as string[] : []
        setClicked({
          pray: types.includes('pray'),
          empathize: types.includes('empathize'),
        })
      } finally {
        setIsLoadingMyReactions(false)
      }
    }

    void loadMyReactions()
  }, [postId])

  async function handleReaction(type: ReactionType) {
    if (isLoadingMyReactions || clicked[type]) {
      return
    }

    setErrorMessage('')
    setSubmittingType(type)

    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '공감을 남기지 못했습니다.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '공감을 남기지 못했습니다.')
      setSubmittingType(null)
      return
    }

    setSubmittingType(null)

    setClicked((previous) => ({
      ...previous,
      [type]: true,
    }))

    setCounts((previous) => ({
      ...previous,
      [type]: previous[type] + 1,
    }))
    void fetch('/api/push/dispatch', { method: 'POST' })
  }

  return (
    <section>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleReaction('empathize')}
          disabled={
            isLoadingMyReactions ||
            submittingType !== null ||
            clicked.empathize
          }
          aria-label={`좋아요 ${counts.empathize}`}
          title="좋아요"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-1.5 text-[13px] font-medium text-[var(--ub-text-secondary)] active:bg-[var(--ub-surface-pressed)] disabled:opacity-60"
        >
          <SystemIcon
            name="heart"
            size={21}
            className={clicked.empathize ? 'fill-current text-[var(--ub-color-brand)]' : undefined}
          />
          <span>{counts.empathize}</span>
        </button>

        <button
          type="button"
          onClick={() => handleReaction('pray')}
          disabled={isLoadingMyReactions || submittingType !== null || clicked.pray}
          aria-label={`기도 ${counts.pray}`}
          title="기도"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-1.5 text-[13px] font-medium text-[var(--ub-text-secondary)] active:bg-[var(--ub-surface-pressed)] disabled:opacity-60"
        >
          <span
            className={clicked.pray ? 'text-[20px] opacity-100' : 'text-[20px] opacity-70'}
            aria-hidden
          >
            🙏
          </span>
          <span>{counts.pray}</span>
        </button>

        <a
          href="#comments"
          aria-label={`댓글 ${commentCount}`}
          title="댓글"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-1.5 text-[13px] font-medium text-[var(--ub-text-secondary)] active:bg-[var(--ub-surface-pressed)]"
        >
          <SystemIcon name="message" size={20} />
          <span>{commentCount}</span>
        </a>
      </div>

      {errorMessage && (
        <div className="mt-3 rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 text-[15px] leading-[21px] text-[#7A1A16]">
          {errorMessage}
        </div>
      )}
    </section>
  )
}
