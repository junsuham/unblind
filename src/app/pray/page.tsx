import type { Metadata } from 'next'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { requireBetaUser } from '@/lib/betaAuth'
import { PrayerRoomScene } from './PrayerRoomScene'
import { generateBiblicalNickname } from '@/lib/profile'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '기도의 방 | 언블라인드',
  description: '도트 캐릭터로 골고다 언덕을 오르고, 함께 들어온 사람들과 이야기하고 묵상합니다.',
}

export default async function PrayTogetherPage() {
  const { user, profile } = await requireBetaUser()
  return (
    <AppShell topTitle="🍁 기도의 방" bottomBar={<BottomTabBar active="prayer" />}>
      <PrayerRoomScene storageScope={user.id} characterName={profile.nickname || generateBiblicalNickname(user.id)} />
    </AppShell>
  )
}
