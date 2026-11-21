import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import MissionCreate from './MissionCreate'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '랜덤 미션 뽑기 | UNBLIND' }

export default async function MissionCreatePage() {
  await requireBetaUser()
  return (
    <AppShell topTitle="랜덤 미션 뽑기" topBackHref="/recreation" bottomBar={<BottomTabBar active="home" />}>
      <MissionCreate />
    </AppShell>
  )
}
