'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TargetType = 'post' | 'comment'
type ActionType = 'hide' | 'delete' | 'restore'

type AdminContentActionButtonsProps = {
  targetType: TargetType
  targetId: string
  targetStatus: string
}

export default function AdminContentActionButtons({
  targetType,
  targetId,
  targetStatus,
}: AdminContentActionButtonsProps) {
  const router = useRouter()

  const [submittingAction, setSubmittingAction] = useState<ActionType | null>(
    null
  )

  async function runAction(action: ActionType) {
    const targetLabel = targetType === 'post' ? '글' : '댓글'

    const confirmMessage =
      action === 'delete'
        ? `정말 이 ${targetLabel}을 삭제 처리할까요? 사용자 화면에서 보이지 않게 됩니다.`
        : action === 'hide'
          ? `이 ${targetLabel}을 숨김 처리할까요?`
          : `이 ${targetLabel}을 다시 노출할까요?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setSubmittingAction(action)

    const response = await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        targetType,
        targetId,
      }),
    })

    setSubmittingAction(null)

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      alert(result?.error ?? '처리에 실패했습니다.')
      return
    }

    router.refresh()
  }

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => runAction('hide')}
        disabled={submittingAction !== null || targetStatus === 'hidden'}
        className="rounded-2xl border border-stone-300 bg-white px-3 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
      >
        {submittingAction === 'hide' ? '처리 중…' : '숨김'}
      </button>

      <button
        type="button"
        onClick={() => runAction('delete')}
        disabled={submittingAction !== null || targetStatus === 'deleted'}
        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
      >
        {submittingAction === 'delete' ? '처리 중…' : '삭제'}
      </button>

      <button
        type="button"
        onClick={() => runAction('restore')}
        disabled={submittingAction !== null || targetStatus === 'visible'}
        className="rounded-2xl border border-green-200 bg-green-50 px-3 py-3 text-sm font-semibold text-green-700 disabled:opacity-50"
      >
        {submittingAction === 'restore' ? '처리 중…' : '복구'}
      </button>
    </div>
  )
}
