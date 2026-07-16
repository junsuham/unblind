'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function BlockUserButton({ blockedUserId, leavePage = false }: { blockedUserId: string; leavePage?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function block() {
    if (!window.confirm('이 사용자의 글과 댓글을 내 화면에서 숨길까요? 계정 관리에서 언제든 해제할 수 있습니다.')) return
    setLoading(true)
    try {
      const response = await fetch('/api/safety/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) return window.alert(result?.error ?? '사용자를 차단하지 못했습니다.')
      if (leavePage) router.push('/')
      else router.refresh()
    } catch {
      window.alert('서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return <button type="button" disabled={loading} onClick={block} className="min-h-9 rounded-full bg-[var(--ub-danger-soft)] px-3 text-[12px] font-semibold text-[var(--ub-danger-text)] disabled:opacity-50">{loading ? '차단 중...' : '사용자 차단'}</button>
}
