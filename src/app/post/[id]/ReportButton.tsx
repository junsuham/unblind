'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
  reporterActorKey: string
  label?: string
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
  reporterActorKey,
  label = '신고',
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

    if (!reporterActorKey) {
      setErrorMessage('로그인 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setMessage('')

    const { error } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reporter_actor_key: reporterActorKey,
      reason,
      detail: detail.trim() || null,
      status: 'pending',
    })

    setIsSubmitting(false)

    if (error) {
      if (error.code === '23505') {
        setMessage('이미 신고한 항목입니다. 운영자가 확인하겠습니다.')
        return
      }

      setErrorMessage(error.message)
      return
    }

    setMessage('신고가 접수되었습니다. 운영자가 확인하겠습니다.')
    setDetail('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-9 items-center rounded-full bg-[#F2F2F7] px-3 text-[13px] font-medium text-[#8E8E93] active:bg-[#E5E5EA]"
      >
        {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-10">
          <div className="max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-[30px] bg-[#F2F2F7] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-[#C7C7CC]" />
            </div>

            <div className="mb-4 flex items-start justify-between gap-4 px-1">
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.3px] text-black">
                  신고하기
                </h2>

                <p className="mt-1 text-[15px] leading-[21px] text-[#3C3C43]/60">
                  운영자가 확인할 수 있도록 신고 사유를 선택해주세요.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex min-h-9 items-center rounded-full bg-white px-3 text-[15px] font-medium text-[#ff4b00]"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="overflow-hidden rounded-[18px] bg-white">
                {reasons.map((item) => (
                  <label
                    key={item.value}
                    className="flex min-h-[54px] cursor-pointer items-center justify-between border-b border-[#D1D1D6]/70 px-4 py-3 last:border-b-0 active:bg-[#E5E5EA]"
                  >
                    <span className="text-[17px] text-black">
                      {item.label}
                    </span>

                    <span
                      className={
                        reason === item.value
                          ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#ff4b00] text-white'
                          : 'h-6 w-6 rounded-full border border-[#C7C7CC] bg-white'
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
                <p className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]">
                  추가 설명
                </p>

                <textarea
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="필요한 경우 상황을 간단히 적어주세요."
                  className="min-h-[120px] w-full resize-none rounded-[18px] bg-white px-4 py-4 text-[17px] leading-[25px] text-black outline-none placeholder:text-[#8E8E93]"
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
                {isSubmitting ? '접수 중...' : '신고 접수하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
