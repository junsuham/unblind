'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddAllowedUserForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [memo, setMemo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add',
        email,
        memo,
      }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      setErrorMessage(result?.error ?? '사용자 추가에 실패했습니다.')
      return
    }

    setMessage('승인 이메일을 추가했습니다.')
    setEmail('')
    setMemo('')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl"
    >
      <h2 className="ios-title text-[var(--ub-text-primary)]">
        사전 승인 이메일 추가
      </h2>

      <p className="mt-1 ios-secondary">
        가입 전에 미리 승인해야 하는 사람이 있을 때만 사용합니다.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block ios-caption font-semibold text-[var(--ub-text-tertiary)]">
            이메일
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="min-h-[52px] w-full rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 ios-body text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:border-[var(--ub-color-brand)]"
          />
        </div>

        <div>
          <label className="mb-2 block ios-caption font-semibold text-[var(--ub-text-tertiary)]">
            메모
          </label>

          <input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="예: 1청년부 / 리더 추천 / 1차 베타"
            className="min-h-[52px] w-full rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 ios-body text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:border-[var(--ub-color-brand)]"
          />
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-[18px] border border-green-200 bg-green-50 p-4 ios-secondary text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-4 ios-secondary text-[#7A1A16]">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 ios-title text-white shadow-sm active:scale-[0.99] disabled:bg-[#8E8E93]"
      >
        {isSubmitting ? '추가 중...' : '사전 승인 추가'}
      </button>
    </form>
  )
}
