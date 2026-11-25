'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CHURCH_DASHBOARD_TARGET_DEPARTMENT,
  churchDashboardGrantBlockers,
  type ChurchDashboardGrantBlocker,
} from '@/lib/churchDashboardScope'

type Props = {
  userId: string
  grantedDepartment: string | null | undefined
  departmentVerified: boolean
  blocker: ChurchDashboardGrantBlocker | null
}

export default function DashboardAccessControl({ userId, grantedDepartment, departmentVerified, blocker }: Props) {
  const router = useRouter()
  const active = grantedDepartment !== undefined
  const current = active && departmentVerified && grantedDepartment === CHURCH_DASHBOARD_TARGET_DEPARTMENT
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  async function changeAccess(action: 'grant' | 'revoke') {
    if (action === 'grant' && (!verified || blocker)) return
    if (action === 'revoke' && !window.confirm('대시보드 접근 권한을 회수할까요?')) return

    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/admin/church-dashboard-access', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, scope: 'verified_2bu', department: CHURCH_DASHBOARD_TARGET_DEPARTMENT, verifiedMembership: verified }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        setError(result?.error ?? '권한을 변경하지 못했습니다.')
        return
      }
      setVerified(false)
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
          {current && !blocker ? '2부 한정' : active ? '등록됨 · 접근 차단' : '권한 없음'}
        </span>
      </div>
      {blocker ? (
        <p className="mt-2 rounded-[12px] bg-[var(--ub-warning-soft)] px-3 py-2 text-[12px] leading-5 text-[var(--ub-warning-text)]">
          {churchDashboardGrantBlockers[blocker]}
        </p>
      ) : (
        <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 rounded-[12px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-3 py-2 text-[12px] text-[var(--ub-text-primary)]">
          <input type="checkbox" disabled={busy} checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-4 w-4 shrink-0 accent-[var(--ub-color-brand)]" />
          실제 2부 소속을 앱 밖에서 확인했습니다.
        </label>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => changeAccess('grant')}
          disabled={busy || Boolean(blocker) || !verified}
          className="min-h-11 flex-1 rounded-[12px] bg-[var(--admin-accent-soft)] px-3 text-[12px] font-bold text-[var(--admin-accent)] disabled:opacity-50"
        >
          {busy ? '처리 중…' : current ? '2부 권한 재확인' : '권한 부여'}
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
