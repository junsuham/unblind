import { requireBetaUser } from '@/lib/betaAuth'
import { getWeeklyManitto } from '@/lib/manitto'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'
import ManittoClient from './ManittoClient'

export const dynamic = 'force-dynamic'

export default async function ManittoPage() {
  const { user } = await requireBetaUser()
  const manitto = await getWeeklyManitto(user.id)

  return (
    <AppShell bottomBar={<BottomTabBar active="manitto" />}>
      <PageHeader
        eyebrow="한 주 동안 조용히 응원해요"
        title="🎁 마니또"
        description="매주 한 명의 익명 친구를 배정받아 기도와 작은 실천으로 응원하는 공간입니다."
      />

      <ManittoClient {...manitto} />
    </AppShell>
  )
}
