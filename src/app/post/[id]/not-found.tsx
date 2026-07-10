import {
  AppShell,
  GlassCard,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
} from '@/app/components/ui/AppShell'

export default function PostNotFoundPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/"
        backLabel="홈"
        eyebrow="언블라인드"
        title="글을 볼 수 없어요"
        description="글이 삭제되었거나, 운영자에 의해 숨김 처리되었을 수 있습니다."
      />

      <GlassCard>
        <p className="text-[17px] leading-[25px] text-black">
          안전한 커뮤니티 운영을 위해 일부 글은 신고 검토 후 숨김 처리될 수
          있습니다.
        </p>

        <p className="mt-3 text-[15px] leading-[21px] text-[#3C3C43]/60">
          계속 문제가 있다면 청년회 운영자에게 문의해주세요.
        </p>
      </GlassCard>

      <div className="mt-6 space-y-3">
        <PrimaryLink href="/">
          홈으로 돌아가기
        </PrimaryLink>

        <SecondaryLink href="/board/prayer">
          기도요청 게시판으로
        </SecondaryLink>
      </div>
    </AppShell>
  )
}
