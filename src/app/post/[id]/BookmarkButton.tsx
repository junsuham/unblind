'use client'

import { useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

export default function BookmarkButton({
  postId,
  initialSaved,
  onBrand = false,
}: {
  postId: string
  userId: string
  initialSaved: boolean
  onBrand?: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function toggle() {
    if (loading) return
    setLoading(true)
    setErrorMessage('')

    try {
      const nextSaved = !saved
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, saved: nextSaved }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? '저장 상태를 변경하지 못했습니다.')
      setSaved(nextSaved)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '저장 상태를 변경하지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="relative">
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? '저장 취소' : '게시글 저장'}
      title={saved ? '저장 취소' : '게시글 저장'}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-50 ${onBrand ? 'bg-white/16 text-white' : 'bg-[var(--ub-surface-muted)] text-[var(--ub-text-secondary)]'}`}
    >
      <SystemIcon name="bookmark" size={18} className={saved ? 'fill-current text-[var(--ub-color-brand)]' : ''} />
    </button>
      {errorMessage && <span className="sr-only" role="alert">{errorMessage}</span>}
    </span>
  )
}
