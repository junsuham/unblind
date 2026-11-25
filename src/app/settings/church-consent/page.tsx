import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { requireBetaUser } from '@/lib/betaAuth'
import { CHURCH_DASHBOARD_TARGET_PLACE_ID } from '@/lib/churchDashboardScope'
import { ChurchInfoConsentForm } from './ChurchInfoConsentForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '교회 정보 동의 | 언블라인드', robots: { index: false, follow: false } }

export default async function ChurchInfoConsentPage() {
  const { supabase, user } = await requireBetaUser()
  const { data: profile } = await supabase.from('user_profiles')
    .select('church_name, church_place_id, church_info_consent_at')
    .eq('user_id', user.id)
    .maybeSingle<{ church_name: string, church_place_id: string, church_info_consent_at: string | null }>()

  if (profile?.church_place_id !== CHURCH_DASHBOARD_TARGET_PLACE_ID) notFound()
  if (profile.church_info_consent_at) redirect('/activity')

  return (
    <AppShell topTitle="교회 정보 동의" topBackHref="/activity" bottomBar={<BottomTabBar />}>
      <section className="ub-liquid-card p-5 text-[var(--ub-text-primary)]">
        <h1 className="text-lg font-bold">등록된 교회 정보 이용 동의</h1>
        <p className="mt-2 text-[13px] leading-6 text-[var(--ub-text-secondary)]">
          이전에 가입한 계정은 교회 정보 이용 동의가 아직 기록되지 않았을 수 있습니다. 재가입할 필요 없이 이 화면에서 동의할 수 있습니다.
        </p>
        <dl className="mt-4 space-y-2 rounded-[16px] bg-[var(--ub-surface-muted)] p-4 text-[13px] leading-5">
          <div><dt className="font-semibold">등록된 교회</dt><dd className="mt-0.5 text-[var(--ub-text-secondary)]">{profile.church_name}</dd></div>
          <div><dt className="font-semibold">이용 항목</dt><dd className="mt-0.5 text-[var(--ub-text-secondary)]">출석 교회, 교회 주소, 선택 입력한 하위 부서</dd></div>
          <div><dt className="font-semibold">이용 목적</dt><dd className="mt-0.5 text-[var(--ub-text-secondary)]">소속 확인, 사칭 방지, 안전한 운영과 운영자 승인. 다른 회원에게는 공개하지 않습니다.</dd></div>
          <div><dt className="font-semibold">보유 기간</dt><dd className="mt-0.5 text-[var(--ub-text-secondary)]">회원 탈퇴 또는 동의 철회 시까지</dd></div>
        </dl>
        <p className="mt-4 text-[13px] leading-6 text-[var(--ub-text-secondary)]">
          동의는 대시보드 권한을 자동으로 부여하지 않습니다. 동의 후 관리자 센터에서 별도로 2부 소속을 확인하고 권한을 부여해야 합니다. 동의하지 않아도 기존 앱 기능을 이용할 수 있습니다.
        </p>
        <ChurchInfoConsentForm />
      </section>
    </AppShell>
  )
}
