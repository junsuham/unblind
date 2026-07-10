'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserAction =
  | 'block'
  | 'unblock'
  | 'reset_agreement'
  | 'remove'
  | 'update_memo'

type AdminUserActionButtonsProps = {
  email: string
  status: 'active' | 'blocked'
  memo: string | null
}

export default function AdminUserActionButtons({
  email,
  status,
  memo,
}: AdminUserActionButtonsProps) {
  const router = useRouter()

  const [submittingAction, setSubmittingAction] = useState<UserAction | null>(
    null
  )

  async function runAction(action: UserAction) {
    let nextMemo: string | null = memo

    const confirmMessage =
      action === 'block'
        ? `${email} 사용자를 차단할까요? 차단되면 로그인 후 입장할 수 없습니다.`
        : action === 'unblock'
          ? `${email} 사용자의 차단을 해제할까요?`
          : action === 'reset_agreement'
            ? `${email} 사용자의 커뮤니티 약속 동의를 초기화할까요? 다음 접속 시 다시 동의해야 합니다.`
            : action === 'remove'
              ? `${email} 사용자를 승인 목록에서 제거할까요? 이 작업은 되돌리려면 다시 추가해야 합니다.`
              : `${email} 사용자의 메모를 수정할까요?`

    if (action === 'update_memo') {
      const promptedMemo = window.prompt('새 메모를 입력하세요.', memo ?? '')

      if (promptedMemo === null) {
        return
      }

      nextMemo = promptedMemo
    } else if (!window.confirm(confirmMessage)) {
      return
    }

    setSubmittingAction(action)

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        email,
        memo: nextMemo,
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

  const baseButtonClass =
    'min-h-[44px] rounded-[14px] px-3 ios-caption font-semibold active:scale-[0.99] disabled:opacity-50'

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {status === 'active' ? (
        <button
          type="button"
          onClick={() => runAction('block')}
          disabled={submittingAction !== null}
          className={`${baseButtonClass} border border-[#FF3B30]/20 bg-[#FF3B30]/10 text-[#7A1A16]`}
        >
          {submittingAction === 'block' ? '처리 중...' : '차단'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => runAction('unblock')}
          disabled={submittingAction !== null}
          className={`${baseButtonClass} border border-green-200 bg-green-50 text-green-700`}
        >
          {submittingAction === 'unblock' ? '처리 중...' : '차단 해제'}
        </button>
      )}

      <button
        type="button"
        onClick={() => runAction('reset_agreement')}
        disabled={submittingAction !== null}
        className={`${baseButtonClass} bg-[#ffe2d2] text-[#ff4b00]`}
      >
        {submittingAction === 'reset_agreement' ? '처리 중...' : '동의 초기화'}
      </button>

      <button
        type="button"
        onClick={() => runAction('update_memo')}
        disabled={submittingAction !== null}
        className={`${baseButtonClass} bg-[#ffe2d2] text-[#ff4b00]`}
      >
        {submittingAction === 'update_memo' ? '처리 중...' : '메모 수정'}
      </button>

      <button
        type="button"
        onClick={() => runAction('remove')}
        disabled={submittingAction !== null}
        className={`${baseButtonClass} bg-[#F2F2F7] text-[#8E8E93]`}
      >
        {submittingAction === 'remove' ? '처리 중...' : '승인 제거'}
      </button>
    </div>
  )
}
