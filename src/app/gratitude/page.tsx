import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import GratitudeJournal from './GratitudeJournal'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '감사일기 챌린지 | UNBLIND',
  description: '하루 한 줄의 감사를 기록하고 익명의 감사 친구에게 전하는 감사일기',
}

export default async function GratitudePage() {
  await requireBetaUser()

  return (
    <AppShell topTitle="감사일기" bottomBar={<BottomTabBar active="home" />}>
      <GratitudeJournal />
    </AppShell>
  )
}
