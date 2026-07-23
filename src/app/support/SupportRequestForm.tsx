'use client'

import { FormEvent, useState } from 'react'

const categoryOptions = [
  ['account', '계정·로그인'],
  ['approval', '가입 승인'],
  ['privacy', '개인정보·권리 행사'],
  ['safety', '신고·안전'],
  ['technical', '기술 문제'],
  ['other', '기타'],
] as const

export default function SupportRequestForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    const form = event.currentTarget
    const data = new FormData(form)
    const response = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.get('email'),
        category: data.get('category'),
        message: data.get('message'),
      }),
    }).catch(() => null)

    if (!response) {
      setStatus('idle')
      setMessage('네트워크 연결을 확인한 뒤 다시 시도해주세요.')
      return
    }

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null

    if (!response.ok) {
      setStatus('idle')
      setMessage(result?.error ?? '문의를 접수하지 못했습니다.')
      return
    }

    form.reset()
    setStatus('success')
    setMessage('문의가 접수되었습니다. 운영자가 확인 후 입력한 이메일로 안내합니다.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="support-email" className="mb-1.5 block text-[14px] font-bold">
          답변받을 이메일
        </label>
        <input
          id="support-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          className="min-h-12 w-full rounded-[14px] border border-[var(--ub-separator)] bg-[var(--ub-surface-card-strong)] px-4 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)]"
          placeholder="name@example.com"
        />
      </div>

      <div>
        <label htmlFor="support-category" className="mb-1.5 block text-[14px] font-bold">
          문의 유형
        </label>
        <select
          id="support-category"
          name="category"
          required
          defaultValue=""
          className="min-h-12 w-full rounded-[14px] border border-[var(--ub-separator)] bg-[var(--ub-surface-card-strong)] px-4 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)]"
        >
          <option value="" disabled>
            선택해주세요
          </option>
          {categoryOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="support-message" className="text-[14px] font-bold">
            문의 내용
          </label>
          <span className="text-[12px] text-[var(--ub-text-secondary)]">
            20–2,000자
          </span>
        </div>
        <textarea
          id="support-message"
          name="message"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          className="w-full resize-y rounded-[14px] border border-[var(--ub-separator)] bg-[var(--ub-surface-card-strong)] px-4 py-3 text-[16px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ub-color-brand)]"
          placeholder="문제가 발생한 화면과 상황을 자세히 적어주세요."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="min-h-12 w-full rounded-[14px] bg-[var(--ub-color-brand)] px-4 text-[16px] font-bold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {status === 'submitting' ? '접수 중…' : '문의 접수'}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`min-h-5 text-[13px] leading-5 ${
          status === 'success'
            ? 'text-emerald-700'
            : 'text-[var(--ub-color-danger,#b42318)]'
        }`}
      >
        {message}
      </p>

      <p className="text-[12px] leading-[18px] text-[var(--ub-text-secondary)]">
        답변과 본인 확인을 위해 이메일과 문의 내용을 처리하며, 처리 완료 후 1년
        이내에 삭제합니다. 긴급한 생명·안전 문제는 112 또는 119에 먼저
        연락해주세요.
      </p>
    </form>
  )
}
