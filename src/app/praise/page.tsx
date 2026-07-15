import { requireBetaUser } from '@/lib/betaAuth'
import PraiseRecommendations from './PraiseRecommendations'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function PraisePage() {
  await requireBetaUser()

  return (
    <AppShell bottomBar={<BottomTabBar active="praise" />}>
      <PageHeader
        eyebrow="매주 새롭게 만나는 찬양"
        title="🎧 언블라인드 TOP 100"
        description="청년의 일상과 예배에 함께할 찬양 100곡을 골랐어요. 재생 버튼을 누르면 이 화면에서 바로 들을 수 있습니다."
      />

      <PraiseRecommendations />
    </AppShell>
  )
}
