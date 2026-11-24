'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
  churchName: string
  department: string | null
  grantedDepartment: string | null | undefined
}

export default function DashboardAccessControl({ userId, churchName, department, grantedDepartment }: Props) {
  const router = useRouter()
  const active = grantedDepartment !== undefined
  const [scope, setScope] = useState<'church' | 'department'>(
    active ? (grantedDepartment ? 'department' : 'church') : (department ? 'department' : 'church')
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function changeAccess(action: 'grant' | 'revoke') {
    const description = action === 'revoke'
      ? '대시보드 접근 권한을 회수할까요?'
      : scope === 'church'
        ? `${churchName} 교회 전체 운영 요약을 볼 수 있도록 허용할까요?`
        : `${churchName} · ${department} 부서의 운영 요약만 볼 수 있도록 허용할까요?`
    if (!window.confirm(description)) return

    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/church-dashboard-access', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, scope }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        setError(result?.error ?? '권한을 변경하지 못했습니다.')
        return
      }
      router.refresh()
    } catch {
      setError('서버에 연결하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-4 rounded-[16px] border border-[var(--ub-separator)] bg-[var(--ub-surface-card-strong)] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold text-[var(--ub-text-primary)]">교회 운영 대시보드</h3>
        <span className="text-[11px] text-[var(--ub-text-secondary)]">
          {active ? (grantedDepartment ? `${grantedDepartment} 한정` : '교회 전체') : '권한 없음'}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[var(--ub-text-secondary)]">
        실제 교회·부서 소속을 별도로 확인한 뒤 부여하세요. 앱에서는 자료를 수정할 수 없습니다.
      </p>
      <div className="mt-3 flex gap-2">
        <select
          aria-label="대시보드 접근 범위"
          value={scope}
          onChange={(event) => setScope(event.target.value as 'church' | 'department')}
          disabled={busy}
          className="min-h-10 min-w-0 flex-1 rounded-[12px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-2 text-[12px] text-[var(--ub-text-primary)]"
        >
          {department && <option value="department">{department}만</option>}
          <option value="church">교회 전체</option>
        </select>
        <button
          type="button"
          onClick={() => changeAccess('grant')}
          disabled={busy}
          className="min-h-10 rounded-[12px] bg-[var(--admin-accent-soft)] px-3 text-[12px] font-bold text-[var(--admin-accent)] disabled:opacity-50"
        >
          {busy ? '처리 중…' : active ? '범위 변경' : '권한 부여'}
        </button>
      </div>
      {active && (
        <button
          type="button"
          onClick={() => changeAccess('revoke')}
          disabled={busy}
          className="mt-2 min-h-9 w-full rounded-[12px] border border-[var(--admin-danger)]/30 text-[12px] font-bold text-[var(--admin-danger)] disabled:opacity-50"
        >
          권한 회수
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-[11px] text-[var(--ub-danger-text)]">{error}</p>}
    </section>
  )
}
