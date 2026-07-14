import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import LogoutButton from '@/app/components/LogoutButton'
import {
  AppShell,
  BottomTabBar,
  GlassCard,
  IosListGroup,
  IosListRow,
  NoticeCard,
  Pill,
} from '@/app/components/ui/AppShell'

const boards = [
  {
    id: 'prayer',
    name: '기도요청',
    description: '함께 기도받고 싶은 제목을 조용히 나눠요.',
    icon: '🙏',
  },
  {
    id: 'faith',
    name: '신앙고민',
    description: '기도, 말씀, 예배, 신앙 회의에 대해 나눠요.',
    icon: '🕊️',
  },
  {
    id: 'church',
    name: '교회생활',
    description: '공동체, 봉사, 소그룹 고민을 나눠요.',
    icon: '⛪',
  },
  {
    id: 'work',
    name: '진로/직장',
    description: '학업, 취업, 직장, 소명 고민을 나눠요.',
    icon: '🌿',
  },
  {
    id: 'relationship',
    name: '연애/결혼',
    description: '관계와 결혼에 대한 고민을 나눠요.',
    icon: '🤍',
  },
]

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  await requireBetaUser()

  return (
    <AppShell showTopLogo={false} bottomBar={<BottomTabBar />}>
      <section className="-mx-4 -mt-[calc(18px+env(safe-area-inset-top))] mb-7 bg-[var(--ub-surface-logo)] px-4 pt-[calc(28px+env(safe-area-inset-top))] pb-8">
        <div className="mx-auto max-w-[430px]">
          <div className="mb-8 flex justify-end">
            <LogoutButton compact />
          </div>

          <Link
            href="/"
            aria-label="언블라인드 홈"
            className="inline-flex active:scale-[0.99]"
          >
            <img
              src="/unblind-logo.png"
              alt="UNBLIND"
              className="block h-[132px] w-[132px]"
            />
          </Link>

          <p className="mt-6 text-[20px] font-medium leading-[30px] text-white/88">
            청년의 때 말하기 어려운 고민과 기도제목을 안전하게 나누는
            익명 공간입니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Pill>Beta</Pill>
            <Pill>사용자 간 익명</Pill>
            <Pill>기도와 경청</Pill>
          </div>
        </div>
      </section>

      <NoticeCard title="이곳의 목적" tone="warning">
        <p>
          언블라인드는 폭로나 판단을 위한 공간이 아니라, 청년들이 마음을
          안전하게 나누고 함께 기도하기 위한 베타 공간입니다.
        </p>
      </NoticeCard>

      <div className="mt-7">
        <IosListGroup
          title="게시판"
          footer="게시판을 먼저 선택한 뒤, 그 안에서 익명으로 글을 작성할 수 있습니다."
        >
          {boards.map((board) => (
            <IosListRow
              key={board.id}
              href={`/board/${board.id}`}
              title={board.name}
              subtitle={board.description}
              leading={board.icon}
            />
          ))}
        </IosListGroup>
      </div>

      <GlassCard>
        <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
          오늘의 사용 원칙
        </p>

        <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
          정답을 주기보다 들어주고, 판단하기보다 기도하고, 누군가를
          특정하기보다 내 마음과 고민을 중심으로 나눠주세요.
        </p>

        <Link
          href="/onboarding"
          className="mt-4 inline-flex min-h-11 items-center text-[15px] font-medium text-[#ff4b00]"
        >
          커뮤니티 약속 다시 보기
        </Link>
      </GlassCard>
    </AppShell>
  )
}
