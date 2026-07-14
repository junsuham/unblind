'use client'

import { FormEvent, useState } from 'react'
import { NoticeCard } from '@/app/components/ui/AppShell'

type CounselResponse = {
  answer?: string
  error?: string
  crisis?: boolean
}

const starterQuestions = [
  '기도가 잘 되지 않아 답답해요',
  '교회 관계 때문에 마음이 힘들어요',
  '진로를 두고 어떻게 기도해야 할까요?',
]

export default function CounselClient() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isCrisis, setIsCrisis] = useState(false)
  const [hasConsented, setHasConsented] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setAnswer('')
    setIsCrisis(false)

    const trimmedQuestion = question.trim()

    if (trimmedQuestion.length < 5) {
      setErrorMessage('고민을 5자 이상 적어주세요.')
      return
    }

    if (!hasConsented) {
      setErrorMessage('AI 응답을 위한 내용 전송 안내를 확인해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/counsel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
      })
      const result = (await response.json()) as CounselResponse

      if (!response.ok || !result.answer) {
        setErrorMessage(result.error ?? '상담 답변을 가져오지 못했습니다.')
        return
      }

      setAnswer(result.answer)
      setIsCrisis(Boolean(result.crisis))
    } catch {
      setErrorMessage('네트워크 연결을 확인한 뒤 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <NoticeCard title="AI 상담 안내" tone="warning">
        <p>
          이 기능은 실제 목사님이나 전문 상담을 대신하지 않습니다. 중요한 결정이나 지속되는 어려움은 신뢰하는 목회자·상담가와 함께 확인해주세요.
        </p>
      </NoticeCard>

      <form
        onSubmit={handleSubmit}
        className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-4 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]"
      >
        <label htmlFor="counsel-question" className="text-[15px] font-semibold">
          어떤 마음을 나누고 싶나요?
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {starterQuestions.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => setQuestion(starter)}
              className="rounded-full bg-[var(--ub-surface-muted)] px-3 py-2 text-left text-[12px] text-[var(--ub-text-secondary)]"
            >
              {starter}
            </button>
          ))}
        </div>

        <textarea
          id="counsel-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={6}
          maxLength={1000}
          placeholder="판단받을 걱정 없이 지금의 상황과 마음을 적어주세요. 이름이나 연락처는 적지 말아주세요."
          className="mt-4 min-h-[144px] w-full resize-none rounded-[16px] bg-[var(--ub-surface-muted)] px-4 py-3 text-[16px] leading-[24px] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:ring-2 focus:ring-[var(--ub-color-brand)]/25"
        />

        <div className="mt-2 flex justify-end text-[12px] text-[var(--ub-text-tertiary)]">
          {question.length}/1000
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-[16px] bg-[var(--ub-surface-muted)] p-3">
          <input
            type="checkbox"
            checked={hasConsented}
            onChange={(event) => setHasConsented(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#ff4b00]"
          />
          <span className="text-[13px] leading-[19px] text-[var(--ub-text-secondary)]">
            상담 내용이 답변 생성을 위해 OpenAI에 전송되며, 이 앱의 게시글이나 상담 기록으로 저장되지 않는다는 안내를 확인했습니다.
          </span>
        </label>

        {errorMessage && (
          <p className="mt-3 rounded-[16px] bg-[var(--ub-danger-soft)] p-3 text-[13px] leading-[19px] text-[var(--ub-danger-text)]">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 flex min-h-[50px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 text-[16px] font-semibold text-white disabled:bg-[#8E8E93]"
        >
          {isSubmitting ? '함께 생각하는 중...' : '목사님 AI에게 상담 요청하기'}
        </button>
      </form>

      {answer && (
        <section
          className={
            isCrisis
              ? 'rounded-[22px] border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] p-5 text-[var(--ub-danger-text)]'
              : 'rounded-[22px] bg-[var(--ub-surface-card-strong)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]'
          }
          aria-live="polite"
        >
          <p className="text-[13px] font-semibold text-[var(--ub-color-brand)]">
            목사님 AI의 답변
          </p>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[25px]">
            {answer}
          </p>
        </section>
      )}
    </div>
  )
}
