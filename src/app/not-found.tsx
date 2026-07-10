import {
  AppShell,
  GlassCard,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
} from '@/app/components/ui/AppShell'

export default function NotFoundPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드"
        title="화면을 찾을 수 없어요"
        description="주소가 잘못되었거나, 더 이상 접근할 수 없는 화면입니다."
      />

      <GlassCard>
        <p className="text-[17px] leading-[25px] text-black">
          홈으로 돌아가 다시 시작해보세요. 글이 숨김 또는 삭제 처리된 경우에도
          이 화면이 보일 수 있습니다.
        </p>
      </GlassCard>

      <div className="mt-6 space-y-3">
        <PrimaryLink href="/">
          홈으로 돌아가기
        </PrimaryLink>

        <SecondaryLink href="/login">
          로그인 화면으로
        </SecondaryLink>
      </div>
    </AppShell>
  )
}
