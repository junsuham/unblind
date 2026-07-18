'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { analyzeTextForSafety } from '@/lib/moderation'
import SafetyIssueList from '@/app/components/SafetyIssueList'
import PraiseMentionInput from '@/app/components/PraiseMentionInput'
import type { ContentMention } from '@/lib/praiseMention'

type CommentFormProps = {
  postId: string
}

export default function CommentForm({ postId }: CommentFormProps) {
  const router = useRouter()

  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<ContentMention[]>([])
  const [checkedRiskReview, setCheckedRiskReview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const safetyAnalysis = useMemo(() => {
    return analyzeTextForSafety(content)
  }, [content])

  const needsRiskReview =
    safetyAnalysis.warningIssues.length > 0 ||
    safetyAnalysis.dangerIssues.length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const trimmedContent = content.trim()

    if (trimmedContent.length < 2) {
      setErrorMessage('댓글을 2자 이상 입력해주세요.')
      return
    }

    if (trimmedContent.length > 1000) {
      setErrorMessage('댓글은 1000자 이하로 입력해주세요.')
      return
    }

    const finalSafetyAnalysis = analyzeTextForSafety(trimmedContent)

    if (finalSafetyAnalysis.blockingIssues.length > 0) {
      setErrorMessage(
        '전화번호, 이메일, 링크, 카카오톡, SNS 아이디처럼 개인을 특정하거나 외부 접촉으로 이어질 수 있는 표현을 제거해주세요.'
      )
      return
    }

    const hasWarnings =
      finalSafetyAnalysis.warningIssues.length > 0 ||
      finalSafetyAnalysis.dangerIssues.length > 0

    if (hasWarnings && !checkedRiskReview) {
      setErrorMessage(
        '경고 내용을 확인한 뒤, 개인이 특정되지 않도록 수정했거나 위험성을 이해했다는 항목에 체크해주세요.'
      )
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: trimmedContent, mentions }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '댓글을 등록하지 못했습니다.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '댓글을 등록하지 못했습니다.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)

    setContent('')
    setMentions([])
    setCheckedRiskReview(false)
    void fetch('/api/push/dispatch', { method: 'POST' })
    router.refresh()
  }

  return (
    <section aria-label="댓글 작성">
      <form
        onSubmit={handleSubmit}
        className="rounded-[22px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-glass)] p-3 shadow-[var(--ub-shadow-glass)] backdrop-blur-2xl"
      >
        <PraiseMentionInput
          value={content}
          onChange={setContent}
          mentions={mentions}
          onMentionsChange={setMentions}
          rows={3}
          maxLength={1000}
          placeholder="댓글을 남겨주세요."
          className="min-h-[84px] w-full resize-none rounded-[16px] bg-[var(--ub-surface-card-strong)] px-4 py-3 text-[16px] leading-[23px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:ring-2 focus:ring-[var(--ub-color-brand)]/25"
        />

        <div className="mt-2 flex justify-end text-[13px] text-[var(--ub-text-tertiary)]">
          {content.length}/1000
        </div>

        <SafetyIssueList issues={safetyAnalysis.issues} />

        {needsRiskReview && (
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[18px] bg-[var(--ub-surface-muted)] p-4">
            <span
              className={
                checkedRiskReview
                  ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff4b00] text-white'
                  : 'mt-0.5 h-6 w-6 shrink-0 rounded-full border border-[var(--ub-control-border)] bg-[var(--ub-surface-card-strong)]'
              }
            >
              {checkedRiskReview && (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M3 7.1 5.6 9.7 11 4.3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>

            <input
              type="checkbox"
              checked={checkedRiskReview}
              onChange={(event) => setCheckedRiskReview(event.target.checked)}
              className="sr-only"
            />

            <span className="text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
              위 경고를 확인했고, 개인이 특정되지 않도록 수정했거나 위험성을 이해했습니다.
            </span>
          </label>
        )}

        {errorMessage && (
          <div className="mt-3 rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 text-[15px] leading-[21px] text-[#7A1A16]">
            {errorMessage}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-11 min-w-[96px] items-center justify-center rounded-full bg-[#ff4b00] px-5 text-[15px] font-bold text-white shadow-sm active:scale-[0.99] disabled:bg-[#8E8E93]"
          >
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </button>
        </div>
      </form>
    </section>
  )
}
