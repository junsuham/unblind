import { requireBetaUser } from '@/lib/betaAuth'
import { getWeeklyManitto } from '@/lib/manitto'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import ManittoClient from './ManittoClient'

export const dynamic = 'force-dynamic'

export default async function ManittoPage() {
  const { user } = await requireBetaUser()
  const manitto = await getWeeklyManitto(user.id)

  return (
    <AppShell bottomBar={<BottomTabBar active="manitto" />}>
      <PageHeader
        eyebrow="한 주 동안 조용히 응원해요"
        title={<span className="inline-flex items-center gap-2"><Emoji3D name="gift" size={32} />마니또</span>}
        description="익명으로 기도와 작은 실천을 나누는 공간입니다."
      />

      <ManittoClient {...manitto} />
    </AppShell>
  )
}
