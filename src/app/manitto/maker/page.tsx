import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import ManittoMakerLobby from './ManittoMakerLobby'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '마니또 모임 만들기 | 언블라인드',
  description: '모임 링크를 만들고 참가자가 직접 들어와 비밀 마니또를 확인합니다.',
}

export default async function ManittoMakerPage() {
  await requireBetaUser()
  return (
    <AppShell topTitle="마니또 메이커" topBackHref="/manitto" bottomBar={<BottomTabBar active="home" />}>
      <ManittoMakerLobby />
    </AppShell>
  )
}
