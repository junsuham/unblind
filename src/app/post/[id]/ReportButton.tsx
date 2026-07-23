'use client'

import { FormEvent, useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type TargetType = 'post' | 'comment'

type ReportReason =
  | 'personal_info'
  | 'attack'
  | 'sexual'
  | 'cult'
  | 'money'
  | 'self_harm'
  | 'spam'
  | 'other'

type ReportButtonProps = {
  targetType: TargetType
  targetId: string
  label?: string
  onBrand?: boolean
}

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'personal_info', label: '개인을 특정할 수 있어요' },
  { value: 'attack', label: '누군가를 공격하거나 비난해요' },
  { value: 'sexual', label: '성적 불쾌감을 줘요' },
  { value: 'cult', label: '이단/사이비 포교 같아요' },
  { value: 'money', label: '금전 요구가 있어요' },
  { value: 'self_harm', label: '자해/위험 내용이 있어요' },
  { value: 'spam', label: '스팸이에요' },
  { value: 'other', label: '기타' },
]

export default function ReportButton({
  targetType,
  targetId,
  label = '신고',
  onBrand = false,
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('personal_info')
  const [detail, setDetail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function closeModal() {
    setIsOpen(false)
    setErrorMessage('')
    setMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, detail: detail.trim() }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '신고를 접수하지 못했습니다.')
      setMessage(result?.duplicate ? '이미 신고한 항목입니다. 운영자가 확인하겠습니다.' : '신고가 접수되었습니다. 운영자가 확인하겠습니다.')
      setDetail('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '신고를 접수하지 못했습니다.')
    } finally {
      setIsSubmitting(false)
    }

  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={label}
        title={label}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${onBrand ? 'bg-white/16 text-white active:bg-white/24' : 'bg-[var(--ub-surface-muted)] text-[var(--ub-text-tertiary)] active:bg-[var(--ub-surface-pressed)]'}`}
      >
        <SystemIcon name="flag" size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-10">
          <div className="max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-[30px] bg-[var(--ub-surface-muted)] p-4 text-[var(--ub-text-primary)] shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-[var(--ub-text-tertiary)]" />
            </div>

            <div className="mb-4 flex items-start justify-between gap-4 px-1">
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.3px] text-[var(--ub-text-primary)]">
                  신고하기
                </h2>

                <p className="mt-1 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
                  운영자가 확인할 수 있도록 신고 사유를 선택해주세요.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex min-h-11 items-center rounded-full bg-[var(--ub-surface-card-strong)] px-3 text-[15px] font-medium text-[var(--ub-color-brand)]"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="overflow-hidden rounded-[18px] bg-[var(--ub-surface-card-strong)]">
                {reasons.map((item) => (
                  <label
                    key={item.value}
                    className="flex min-h-[54px] cursor-pointer items-center justify-between border-b border-[var(--ub-separator)] px-4 py-3 last:border-b-0 active:bg-[var(--ub-surface-pressed)]"
                  >
                    <span className="text-[17px] text-[var(--ub-text-primary)]">
                      {item.label}
                    </span>

                    <span
                      className={
                        reason === item.value
                          ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#ff4b00] text-white'
                          : 'h-6 w-6 rounded-full border border-[var(--ub-control-border)] bg-[var(--ub-surface-card-strong)]'
                      }
                    >
                      {reason === item.value && (
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
                      type="radio"
                      name="reason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={() => setReason(item.value)}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>

              <div>
                <p className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-tertiary)]">
                  추가 설명
                </p>

                <textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="필요한 경우 상황을 간단히 적어주세요."
                  className="min-h-[120px] w-full resize-none rounded-[18px] bg-[var(--ub-surface-card-strong)] px-4 py-4 text-[17px] leading-[25px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)]"
                />
              </div>

              {message && (
                <div className="rounded-[18px] border border-green-200 bg-green-50 p-4 text-[15px] leading-[21px] text-green-700">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 text-[15px] leading-[21px] text-[#7A1A16]">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#FF3B30] px-5 text-[17px] font-semibold text-white active:scale-[0.99] disabled:bg-[#8E8E93]"
              >
                {isSubmitting ? '접수 중…' : '신고 접수하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
