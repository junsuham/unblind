import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import LogoutButton from '@/app/components/LogoutButton'
import {
  AppShell,
  GlassCard,
  NoticeCard,
  PageHeader,
  Pill,
} from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function PendingPage() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('completed_at, nickname')
    .eq('user_id', user.id)
    .maybeSingle<{ completed_at: string; nickname: string }>()

  if (!profile?.completed_at) {
    redirect('/profile/setup')
  }

  const { data: accessRecord } = user?.email
    ? await supabase
        .from('allowed_users')
        .select('status')
        .ilike('email', user.email)
        .maybeSingle<{ status: 'active' | 'blocked' }>()
    : { data: null }

  const isBlocked = accessRecord?.status === 'blocked'

  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드 Beta"
        title={isBlocked ? '이용 제한' : '가입 승인 대기'}
        description={
          isBlocked
            ? '현재 이 계정의 이용이 제한되어 있습니다. 청년회 운영자에게 문의해주세요.'
            : 'Google 가입이 접수되었습니다. 운영자가 관리자 페이지에서 승인하면 입장할 수 있습니다.'
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>{isBlocked ? '이용 제한' : '승인 대기'}</Pill>
        <Pill>청년회 내부</Pill>
      </div>

      <GlassCard>
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-tertiary)]">
          현재 로그인한 이메일
        </p>

        <p className="mt-2 break-all text-[17px] leading-[24px] text-[var(--ub-text-primary)]">
          {user?.email ?? '이메일을 확인할 수 없습니다'}
        </p>

        <p className="mt-3 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
          앱 아이디: <span className="font-semibold text-[var(--ub-text-primary)]">{profile.nickname}</span>
        </p>

        <p className="mt-3 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
          {isBlocked
            ? '차단 해제 후 다시 승인 상태를 확인해주세요.'
            : '운영자가 승인하면 로그아웃하지 않아도 바로 입장할 수 있습니다.'}
        </p>
      </GlassCard>

      <div className="mt-5">
        <NoticeCard
          title={isBlocked ? '이용 제한 안내' : '왜 승인이 필요한가요?'}
          tone="warning"
        >
          <p>
            {isBlocked
              ? '운영 기준에 따라 이용이 제한된 계정입니다. 제한 사유와 해제 여부는 운영자에게 문의해주세요.'
              : '언블라인드는 청년회 내부 베타 공간입니다. 익명성을 안전하게 유지하기 위해 운영자가 가입 계정을 확인한 뒤 승인합니다.'}
          </p>
        </NoticeCard>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[16px] bg-[var(--ub-surface-pressed)] px-4 text-[17px] font-semibold text-[var(--ub-color-brand)] active:scale-[0.99]"
        >
          승인 상태 확인
        </Link>

        <LogoutButton />
      </div>
    </AppShell>
  )
}
