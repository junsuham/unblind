'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  currentStatus: string
  currentNote: string | null
}

export default function SupportRequestActions({
  id,
  currentStatus,
  currentNote,
}: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')

    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: data.get('status'),
        note: data.get('note'),
      }),
    }).catch(() => null)

    if (!response) {
      setPending(false)
      setMessage('네트워크 연결을 확인해주세요.')
      return
    }

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null

    if (!response.ok) {
      setPending(false)
      setMessage(result?.error ?? '상태를 변경하지 못했습니다.')
      return
    }

    setMessage('처리 상태를 저장했습니다.')
    setPending(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label htmlFor={`support-status-${id}`} className="sr-only">
          처리 상태
        </label>
        <select
          id={`support-status-${id}`}
          name="status"
          defaultValue={currentStatus}
          className="min-h-11 min-w-0 rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-[15px] text-[var(--admin-text)]"
        >
          <option value="open">미처리</option>
          <option value="in_progress">처리 중</option>
          <option value="resolved">답변 완료</option>
          <option value="closed">종결</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-[12px] bg-[var(--admin-accent)] px-4 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
      </div>

      <label htmlFor={`support-note-${id}`} className="sr-only">
        처리 메모
      </label>
      <textarea
        id={`support-note-${id}`}
        name="note"
        required
        minLength={3}
        maxLength={1000}
        rows={3}
        defaultValue={currentNote ?? ''}
        placeholder="확인한 내용과 답변 또는 후속 조치를 기록하세요."
        className="w-full resize-y rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2.5 text-[15px] leading-5 text-[var(--admin-text)]"
      />
      <p role="status" aria-live="polite" className="min-h-4 text-[12px] text-[var(--admin-text-secondary)]">
        {message}
      </p>
    </form>
  )
}
