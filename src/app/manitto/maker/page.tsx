import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import ManittoMakerLobby from './ManittoMakerLobby'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '기도 마니또 만들기 | 언블라인드',
  description: '명단을 만들고 한 사람을 위해 비밀스럽게 기도하고 응원해요.',
}

export default async function ManittoMakerPage() {
  await requireBetaUser()
  return (
    <AppShell topTitle="마니또 메이커" topBackHref="/manitto" bottomBar={<BottomTabBar active="home" />}>
      <ManittoMakerLobby />
    </AppShell>
  )
}
