import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell, GlassCard, PageHeader } from '@/app/components/ui/AppShell'
import SupportRequestForm from './SupportRequestForm'

export const metadata: Metadata = {
  title: '고객지원 | 언블라인드',
  description: '언블라인드 이용, 계정, 신고 및 개인정보 관련 도움말',
}

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()

  return (
    <AppShell>
      <PageHeader
        title="언블라인드 고객지원"
        titleSize="compact"
        description="앱 이용 중 필요한 도움을 확인할 수 있습니다."
      />

      <div className="space-y-3">
        <GlassCard>
          <h2 className="text-[17px] font-bold">계정과 가입 승인</h2>
          <p className="mt-2 text-[14px] leading-[22px] text-[var(--ub-text-secondary)]">
            언블라인드는 Google 계정 확인과 운영자 승인을 마친 구성원만 이용할 수
            있습니다. 가입 승인이나 이용 제한에 관한 문의는 소속 청년회 운영자에게
            전달해주세요.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[17px] font-bold">신고·차단·계정 삭제</h2>
          <p className="mt-2 text-[14px] leading-[22px] text-[var(--ub-text-secondary)]">
            게시물과 댓글의 신고 및 사용자 차단은 해당 콘텐츠 화면에서 할 수 있습니다.
            신고 처리 현황, 차단 해제, 계정 영구 삭제는 앱의 내 정보 → 계정 관리에서
            처리할 수 있습니다.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[17px] font-bold">정책과 문의</h2>
          <div className="mt-3 flex flex-col gap-3 text-[14px] font-semibold text-[var(--ub-color-brand)]">
            <Link href="/policies/privacy">개인정보처리방침</Link>
            <Link href="/policies/terms">이용약관</Link>
            <Link href="/policies/community">커뮤니티 운영정책</Link>
            {supportEmail ? <a href={`mailto:${supportEmail}`}>이메일로 문의</a> : null}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-[17px] font-bold">운영팀에 문의</h2>
          <p className="mb-4 mt-2 text-[14px] leading-[22px] text-[var(--ub-text-secondary)]">
            계정, 개인정보, 신고 처리, 기술 문제를 앱 안에서 안전하게 접수할 수
            있습니다.
          </p>
          <SupportRequestForm />
        </GlassCard>
      </div>
    </AppShell>
  )
}
