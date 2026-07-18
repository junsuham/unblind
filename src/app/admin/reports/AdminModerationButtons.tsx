'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TargetType = 'post' | 'comment'
type ActionType = 'hide' | 'delete' | 'restore' | 'dismiss'

type AdminModerationButtonsProps = {
  targetType: TargetType
  targetId: string
  reportId: string
  targetStatus: string
}

export default function AdminModerationButtons({
  targetType,
  targetId,
  reportId,
  targetStatus,
}: AdminModerationButtonsProps) {
  const router = useRouter()

  const [submittingAction, setSubmittingAction] = useState<ActionType | null>(
    null
  )

  async function runAction(action: ActionType) {
    const confirmMessage =
      action === 'delete'
        ? '정말 삭제 처리할까요? 사용자 화면에서 보이지 않게 됩니다.'
        : action === 'hide'
          ? '이 항목을 숨김 처리할까요?'
          : action === 'restore'
            ? '이 항목을 다시 노출할까요?'
            : '이 신고를 문제 없음으로 처리할까요?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    const memo = window.prompt(
      action === 'dismiss' ? '신고자에게 보일 처리 메모를 입력하세요.' : '조치 사유를 간단히 입력하세요.',
      action === 'dismiss'
        ? '운영정책 위반 내용을 확인하지 못했습니다.'
        : action === 'restore'
          ? '재검토 결과 노출 가능한 내용으로 확인되어 복구했습니다.'
          : action === 'hide'
            ? '신고 검토 후 운영정책에 따라 숨김 처리했습니다.'
            : '신고 검토 후 운영정책에 따라 삭제 처리했습니다.'
    )
    if (memo === null) return
    if (memo.trim().length < 3) {
      window.alert('조치 사유를 3자 이상 입력해주세요.')
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
        reportId,
        memo,
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
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => runAction('hide')}
        disabled={submittingAction !== null || targetStatus === 'hidden'}
        className="rounded-2xl border border-stone-300 bg-white px-3 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
      >
        {submittingAction === 'hide' ? '처리 중...' : '숨김'}
      </button>

      <button
        type="button"
        onClick={() => runAction('delete')}
        disabled={submittingAction !== null || targetStatus === 'deleted'}
        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
      >
        {submittingAction === 'delete' ? '처리 중...' : '삭제'}
      </button>

      <button
        type="button"
        onClick={() => runAction('dismiss')}
        disabled={submittingAction !== null}
        className="rounded-2xl border border-stone-300 bg-white px-3 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
      >
        {submittingAction === 'dismiss' ? '처리 중...' : '문제 없음'}
      </button>

      <button
        type="button"
        onClick={() => runAction('restore')}
        disabled={submittingAction !== null || targetStatus === 'visible'}
        className="rounded-2xl border border-stone-300 bg-white px-3 py-3 text-sm font-semibold text-stone-700 disabled:opacity-50"
      >
        {submittingAction === 'restore' ? '처리 중...' : '복구'}
      </button>
    </div>
  )
}
