import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import RecreationKit from './RecreationKit'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '모임 KIT | UNBLIND',
  description: '교회 모임에서 바로 사용할 수 있는 검증된 게임과 디자인 진행 도구',
}

export default async function RecreationPage() {
  await requireBetaUser()

  return (
    <AppShell topTitle="모임 KIT" bottomBar={<BottomTabBar active="home" />}>
      <RecreationKit />
    </AppShell>
  )
}
