import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { getWeeklyManitto } from '@/lib/manitto'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import ManittoClient from './ManittoClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '마니또 메이커 | 언블라인드',
  description: '한 주 동안 익명으로 한 사람을 위해 기도하고 응원합니다.',
}

export default async function ManittoPage() {
  const { user } = await requireBetaUser()
  const manitto = await getWeeklyManitto(user.id)

  return (
    <AppShell topTitle="마니또 메이커" bottomBar={<BottomTabBar active="home" />}>
      <p className="mb-4 px-1 text-[14px] leading-[21px] text-[var(--ub-text-on-brand-secondary)]">한 주 동안 한 사람의 익명 기도 친구가 되어주세요.</p>
      <ManittoClient {...manitto} />
    </AppShell>
  )
}
