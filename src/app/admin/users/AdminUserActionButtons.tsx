'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserAction =
  | 'add'
  | 'block'
  | 'unblock'
  | 'reset_agreement'
  | 'remove'
  | 'update_memo'

type AdminUserActionButtonsProps = {
  email: string
  status: 'pending' | 'active' | 'blocked'
  memo: string | null
  profileComplete: boolean
}

function normalizeActionEmail(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
}

export default function AdminUserActionButtons({
  email,
  status,
  memo,
  profileComplete,
}: AdminUserActionButtonsProps) {
  const router = useRouter()

  const [submittingAction, setSubmittingAction] = useState<UserAction | null>(
    null
  )

  async function runAction(action: UserAction) {
    const targetEmail = normalizeActionEmail(email)

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      window.alert('선택한 사용자의 이메일을 확인할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해주세요.')
      return
    }

    let nextMemo: string | null = memo

    const confirmMessage =
      action === 'add'
        ? `${email} 사용자의 가입을 승인할까요? 승인 후 바로 커뮤니티에 입장할 수 있습니다.`
        : action === 'block'
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

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Unblind-Target-Email': targetEmail,
        },
        body: JSON.stringify({
          action,
          email: targetEmail,
          memo: nextMemo,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        window.alert(result?.error ?? '처리에 실패했습니다.')
        return
      }

      router.refresh()
    } catch {
      window.alert('서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmittingAction(null)
    }
  }

  const baseButtonClass =
    'min-h-[46px] rounded-[14px] border px-3 text-[14px] font-bold active:scale-[0.99] disabled:opacity-45'
  const successButtonClass =
    'border-[var(--admin-success)]/30 bg-[var(--admin-success-soft)] text-[var(--admin-success)]'
  const dangerButtonClass =
    'border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]'
  const accentButtonClass =
    'border-[var(--admin-accent)]/25 bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'

  if (status === 'pending') {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => runAction('add')}
          disabled={submittingAction !== null || !profileComplete}
          className={`${baseButtonClass} ${successButtonClass}`}
        >
          {submittingAction === 'add'
            ? '승인 중...'
            : profileComplete
              ? '가입 승인'
              : '정보 입력 대기'}
        </button>

        <button
          type="button"
          onClick={() => runAction('block')}
          disabled={submittingAction !== null}
          className={`${baseButtonClass} ${dangerButtonClass}`}
        >
          {submittingAction === 'block' ? '처리 중...' : '가입 차단'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {status === 'active' ? (
        <button
          type="button"
          onClick={() => runAction('block')}
          disabled={submittingAction !== null}
          className={`${baseButtonClass} ${dangerButtonClass}`}
        >
          {submittingAction === 'block' ? '처리 중...' : '차단'}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => runAction('unblock')}
          disabled={submittingAction !== null}
          className={`${baseButtonClass} ${successButtonClass}`}
        >
          {submittingAction === 'unblock' ? '처리 중...' : '차단 해제'}
        </button>
      )}

      <button
        type="button"
        onClick={() => runAction('reset_agreement')}
        disabled={submittingAction !== null}
        className={`${baseButtonClass} ${accentButtonClass}`}
      >
        {submittingAction === 'reset_agreement' ? '처리 중...' : '동의 초기화'}
      </button>

      <button
        type="button"
        onClick={() => runAction('update_memo')}
        disabled={submittingAction !== null}
        className={`${baseButtonClass} ${accentButtonClass}`}
      >
        {submittingAction === 'update_memo' ? '처리 중...' : '메모 수정'}
      </button>

      <button
        type="button"
        onClick={() => runAction('remove')}
        disabled={submittingAction !== null}
        className={`${baseButtonClass} border-[var(--admin-danger)]/35 bg-[var(--admin-card-secondary)] text-[var(--admin-danger)]`}
      >
        {submittingAction === 'remove' ? '처리 중...' : '승인목록 제거'}
      </button>
    </div>
  )
}
