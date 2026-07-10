import Link from 'next/link'
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

  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드 Beta"
        title="승인 대기"
        description="아직 승인된 이메일이 아닙니다. 청년회 운영자에게 등록을 요청해주세요."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>승인제 베타</Pill>
        <Pill>청년회 내부</Pill>
      </div>

      <GlassCard>
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]">
          현재 로그인한 이메일
        </p>

        <p className="mt-2 break-all text-[17px] leading-[24px] text-black">
          {user?.email ?? '이메일을 확인할 수 없습니다'}
        </p>

        <p className="mt-3 text-[15px] leading-[21px] text-[#3C3C43]/60">
          운영자가 이 이메일을 승인 목록에 추가하면 다시 로그인 후 입장할 수 있습니다.
        </p>
      </GlassCard>

      <div className="mt-5">
        <NoticeCard title="왜 승인이 필요한가요?" tone="warning">
          <p>
            언블라인드는 청년회 내부 베타 공간입니다. 익명성을 안전하게
            유지하기 위해 승인된 이메일만 입장할 수 있습니다.
          </p>
        </NoticeCard>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/login"
          className="flex min-h-[52px] flex-1 items-center justify-center rounded-[16px] bg-[#E5E5EA] px-4 text-[17px] font-semibold text-[#ff4b00] active:scale-[0.99]"
        >
          로그인으로
        </Link>

        <LogoutButton />
      </div>
    </AppShell>
  )
}
