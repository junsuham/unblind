import { requireBetaUser } from '@/lib/betaAuth'
import CounselClient from './CounselClient'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function CounselPage() {
  await requireBetaUser()

  return (
    <AppShell bottomBar={<BottomTabBar active="counsel" />}>
      <PageHeader
        eyebrow="마음을 나누는 곳"
        title="목사님 AI 상담"
        description="목회 상담을 돕는 AI에게 지금의 고민을 익명으로 나눠보세요."
      />

      <CounselClient />
    </AppShell>
  )
}
