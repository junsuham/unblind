'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage('')

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    setIsSubmitting(false)

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      setErrorMessage(result?.error ?? '로그인에 실패했습니다.')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="ub-app-surface min-h-screen px-4 pb-10 pt-8 text-[var(--ub-text-on-brand-primary)]">
      <section className="mx-auto max-w-[430px]">
        <header className="mb-8">
          <p className="mb-1 text-[13px] font-semibold text-[var(--ub-text-on-brand-tertiary)]">
            운영자 전용
          </p>

          <h1 className="text-[34px] font-bold leading-[38px] tracking-[-0.7px] text-[var(--ub-text-on-brand-primary)]">
            관리자 로그인
          </h1>

          <p className="mt-3 text-[17px] leading-[25px] text-[var(--ub-text-on-brand-secondary)]">
            신고 처리, 참여자 승인, 게시글 관리를 위한 운영자 화면입니다.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl"
        >
          <label className="mb-2 block text-[15px] font-semibold text-[var(--ub-text-primary)]">
            관리자 비밀번호
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-[52px] w-full rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 text-[17px] text-[var(--ub-text-primary)] outline-none focus:border-[var(--ub-color-brand)]"
            placeholder="ADMIN_PASSWORD"
          />

          {errorMessage && (
            <div className="mt-4 rounded-[18px] border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] p-4 text-[15px] leading-[21px] text-[var(--ub-danger-text)]">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 text-[17px] font-semibold text-white shadow-sm active:scale-[0.99] disabled:bg-[#8E8E93]"
          >
            {isSubmitting ? '로그인 중...' : '관리자 로그인'}
          </button>
        </form>

        <div className="mt-5 rounded-[22px] border border-[var(--ub-warning-border)] bg-[var(--ub-warning-soft)] p-4 text-[15px] leading-[21px] text-[var(--ub-warning-text)]">
          <p className="font-semibold text-[var(--ub-text-primary)]">운영자 주의</p>
          <p className="mt-1">
            관리자 화면에서는 작성자와 신고자 정보를 확인할 수 있습니다.
            신고 대응과 안전 운영 목적에 한해 사용해주세요.
          </p>
        </div>
      </section>
    </main>
  )
}
