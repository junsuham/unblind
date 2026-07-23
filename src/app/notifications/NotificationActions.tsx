'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NotificationActions({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function markAllRead() {
    if (pending) return
    setPending(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '알림을 읽음 처리하지 못했습니다.')
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '알림을 읽음 처리하지 못했습니다.')
    } finally {
      setPending(false)
    }
  }

  if (!hasUnread) return null

  return (
    <div className="flex items-center gap-2">
      {errorMessage && <span className="text-[12px] font-semibold text-[var(--ub-danger-text)]" role="alert">{errorMessage}</span>}
      <button
        type="button"
        onClick={markAllRead}
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--ub-surface-card)] px-4 text-[13px] font-semibold text-[var(--ub-color-brand)] disabled:opacity-55"
      >
        {pending ? '처리 중…' : '모두 읽음'}
      </button>
    </div>
  )
}
