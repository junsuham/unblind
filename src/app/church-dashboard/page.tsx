import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { requireBetaUser } from '@/lib/betaAuth'
import { getChurchDashboardAccess } from '@/lib/churchDashboardAccess'
import { readChurchDashboardSnapshot } from '@/lib/churchDashboardData'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '교회 운영 대시보드 | 언블라인드',
  description: '권한이 부여된 교회 운영자의 읽기 전용 요약입니다.',
  robots: { index: false, follow: false },
}

function count(value: number | null, suffix = '') {
  return value === null ? '—' : `${new Intl.NumberFormat('ko-KR').format(value)}${suffix}`
}

export default async function ChurchDashboardPage() {
  const { user } = await requireBetaUser()
  const access = await getChurchDashboardAccess(user)
  if (!access) notFound()

  const { snapshot, error } = await readChurchDashboardSnapshot(access)
  const stats = snapshot ? [
    { label: '등록 인원', value: count(snapshot.memberCount, '명') },
    { label: '최근 출석', value: count(snapshot.attendanceCount, '명') },
    { label: '기도 시간', value: count(snapshot.prayerMinutes, '분') },
    { label: '돌봄 확인', value: count(snapshot.carePendingCount, '건') },
    { label: '다가오는 일정', value: count(snapshot.upcomingEventCount, '건') },
  ] : []

  return (
    <AppShell topTitle="대시보드" topBackHref="/activity" bottomBar={<BottomTabBar />}>
      <header className="mb-5 rounded-[22px] bg-[var(--ub-surface-card-strong)] p-5 shadow-sm">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[var(--ub-color-brand)]">교회 운영 · 읽기 전용</p>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
            <SystemIcon name="dashboard" size={21} />
          </span>
          <h2 className="min-w-0 text-[20px] font-extrabold tracking-[-0.4px] text-[var(--ub-text-primary)]">{access.churchName}</h2>
        </div>
        <p className="mt-1 text-[13px] text-[var(--ub-text-secondary)]">
          {access.department ? `${access.department} 자료만 표시됩니다.` : '교회 전체 요약이 표시됩니다.'}
        </p>
      </header>

      {!snapshot ? (
        <section role="status" className="rounded-[22px] bg-[var(--ub-surface-card-strong)] px-5 py-8 text-center shadow-sm">
          <h2 className="text-[16px] font-bold text-[var(--ub-text-primary)]">
            {error ? '운영 자료를 불러오지 못했습니다' : '연결된 운영 자료가 없습니다'}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--ub-text-secondary)]">
            {error
              ? '잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 알려주세요.'
              : '관리자가 해당 교회·부서의 읽기 전용 자료를 연동하면 이곳에 표시됩니다.'}
          </p>
        </section>
      ) : (
        <>
          <p className="mb-2 px-1 text-[11px] text-[var(--ub-text-tertiary)]">
            자료 기준 {new Date(snapshot.generatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          </p>
          <section aria-label="교회 운영 요약" className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[18px] bg-[var(--ub-surface-card-strong)] p-4 shadow-sm">
                <p className="text-[12px] text-[var(--ub-text-secondary)]">{stat.label}</p>
                <p className="mt-2 text-[21px] font-extrabold text-[var(--ub-text-primary)]">{stat.value}</p>
              </div>
            ))}
          </section>
          {snapshot.attendanceWeeks.length > 0 && (
            <section className="mt-5 overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-sm">
              <h2 className="px-4 py-4 text-[15px] font-bold text-[var(--ub-text-primary)]">주별 출석</h2>
              <ul>
                {snapshot.attendanceWeeks.map((week) => (
                  <li key={week.date} className="flex items-center justify-between gap-4 border-t border-[var(--ub-separator)] px-4 py-3 text-[13px]">
                    <span className="min-w-0 truncate text-[var(--ub-text-secondary)]">{week.label}</span>
                    <strong className="shrink-0 text-[var(--ub-text-primary)]">{count(week.attendance, '명')}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="mt-5 px-2 text-[11px] leading-5 text-[var(--ub-text-tertiary)]">
            5명 미만 집계와 개인별 교인·기도 기록은 표시하지 않습니다. 운영 자료의 수정은 앱에서 할 수 없습니다.
          </p>
        </>
      )}
    </AppShell>
  )
}
