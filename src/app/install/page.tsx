import Link from 'next/link'
import {
  AppShell,
  GlassCard,
  NoticeCard,
  PageHeader,
} from '@/app/components/ui/AppShell'
import { InstallLaunchButton } from './InstallLaunchButton'

export const metadata = {
  title: '앱 설치 | 언블라인드',
  description: '언블라인드를 iPhone과 Android에 설치하는 방법',
}

export default function InstallPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="iOS · Android 무료 설치"
        title="언블라인드를 앱처럼 사용하세요"
        description="사용 중인 기기에 맞는 설치 화면을 자동으로 보여드립니다. 설치 후에는 홈 화면에서 바로 시작할 수 있습니다."
      />

      <InstallLaunchButton />

      <GlassCard className="mt-5">
        <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ub-color-brand)]">iPhone 설치</p>
        <ol className="space-y-5">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-[14px] font-bold text-white">1</span>
            <div>
              <p className="ios-title">Safari로 이 페이지 열기</p>
              <p className="mt-1 ios-secondary">카카오톡이나 다른 앱 안에서 열었다면 메뉴에서 Safari로 열기를 선택하세요.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-[14px] font-bold text-white">2</span>
            <div>
              <p className="ios-title">공유 버튼 누르기</p>
              <p className="mt-1 ios-secondary">Safari 화면 아래쪽의 네모에서 위쪽 화살표가 나오는 공유 버튼을 누르세요.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-[14px] font-bold text-white">3</span>
            <div>
              <p className="ios-title">홈 화면에 추가</p>
              <p className="mt-1 ios-secondary">목록에서 홈 화면에 추가를 선택하고 오른쪽 위의 추가를 누르세요.</p>
            </div>
          </li>
        </ol>
      </GlassCard>

      <GlassCard className="mt-5">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ub-color-brand)]">Android 설치</p>
        <p className="mt-3 ios-title">설치 버튼 한 번이면 됩니다</p>
        <p className="mt-1 ios-secondary">Chrome에서 앱 설치 시작을 누르면 Android 시스템 설치창이 바로 열립니다. 설치를 승인하면 홈 화면에 언블라인드가 추가됩니다.</p>
      </GlassCard>

      <div className="mt-5 space-y-3">
        <NoticeCard title="설치가 완료되면">
          <p>홈 화면의 언블라인드 아이콘으로 실행하세요. 주소창 없이 전체 화면으로 열립니다.</p>
        </NoticeCard>
        <NoticeCard title="업데이트 안내" tone="warning">
          <p>새 버전이 준비되면 앱 안에서 업데이트 버튼을 보여드립니다. 다시 설치할 필요는 없습니다.</p>
        </NoticeCard>
      </div>

      <Link href="/" className="mt-5 flex min-h-[52px] items-center justify-center rounded-[16px] bg-[var(--ub-surface-card-strong)] px-5 ios-title text-[var(--ub-color-brand)] shadow-sm">
        언블라인드로 돌아가기
      </Link>
    </AppShell>
  )
}
