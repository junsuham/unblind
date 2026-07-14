import { requireBetaUser } from '@/lib/betaAuth'
import PraiseRecommendations from './PraiseRecommendations'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function PraisePage() {
  await requireBetaUser()

  return (
    <AppShell bottomBar={<BottomTabBar active="praise" />}>
      <PageHeader
        eyebrow="오늘의 마음에 맞는"
        title="찬양 추천"
        description="지금 필요한 마음을 고르면 함께 들을 찬양을 추천해드려요."
      />

      <PraiseRecommendations />
    </AppShell>
  )
}
