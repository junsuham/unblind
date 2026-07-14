import { requireAllowedUser } from '@/lib/betaAuth'
import AgreementForm from './AgreementForm'
import {
  AppShell,
  GlassCard,
  PageHeader,
  Pill,
} from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const { user, allowedUser } = await requireAllowedUser()

  const alreadyAgreed = !!allowedUser.agreed_at

  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드 Beta"
        title={alreadyAgreed ? '커뮤니티 약속' : '들어가기 전 약속해주세요'}
        description={
          alreadyAgreed
            ? '이미 동의한 커뮤니티 약속을 다시 확인할 수 있습니다.'
            : '이 공간은 익명 폭로 게시판이 아니라, 서로를 살리고 기도하기 위한 나눔 공간입니다.'
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>캡처 금지</Pill>
        <Pill>실명 언급 금지</Pill>
        <Pill>기도와 경청</Pill>
      </div>

      <GlassCard className="mb-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-tertiary)]">
          현재 로그인
        </p>

        <p className="mt-2 break-all text-[17px] leading-[24px] text-[var(--ub-text-primary)]">
          {user.email}
        </p>

        <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
          사용자 화면에서는 이 이메일이 다른 사람에게 공개되지 않습니다.
        </p>
      </GlassCard>

      <AgreementForm alreadyAgreed={alreadyAgreed} />
    </AppShell>
  )
}
