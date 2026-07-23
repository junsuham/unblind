import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import BibleCharacterMbti from './BibleCharacterMbti'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '성경 MBTI | UNBLIND',
  description: '나의 성향과 닮은 성경 속 믿음의 인물을 발견하는 묵상형 테스트',
}

export default async function BibleCharacterMbtiPage() {
  await requireBetaUser()

  return (
    <AppShell topTitle="성경 MBTI" bottomBar={<BottomTabBar active="home" />}>
      <BibleCharacterMbti />
    </AppShell>
  )
}
