import type { Metadata } from 'next'
import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import { getWeeklyManitto } from '@/lib/manitto'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import ManittoClient from './ManittoClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '마니또 메이커 | 언블라인드',
  description: '링크로 마니또 모임을 만들고 익명 기도 친구를 만나세요.',
}

export default async function ManittoPage() {
  const { user } = await requireBetaUser()
  const manitto = await getWeeklyManitto(user.id)

  return (
    <AppShell topTitle="마니또 메이커" bottomBar={<BottomTabBar active="home" />}>
      <Link href="/manitto/maker" className="ub-liquid-card mb-6 flex min-h-[118px] items-center gap-4 p-5 text-[var(--ub-text-primary)] active:scale-[0.99]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]"><SystemIcon name="gift" size={29} /></span>
        <span className="min-w-0 flex-1"><strong className="block text-[18px]">우리 모임 기도 마니또 만들기</strong><span className="mt-1 block break-keep text-[12px] leading-[18px] text-[var(--ub-text-secondary)]">참가자 명단을 만들고 각자 확인할 수 있는 비밀 링크를 보내요.</span></span>
        <span aria-hidden className="text-[23px] text-[var(--ub-text-tertiary)]">›</span>
      </Link>
      <div className="mb-3 px-1"><h2 className="text-[16px] font-bold text-[var(--ub-text-on-brand-primary)]">언블라인드 주간 마니또</h2><p className="mt-1 text-[12px] text-[var(--ub-text-on-brand-secondary)]">앱 참여자들과 한 주 동안 익명으로 기도하고 응원해요.</p></div>
      <ManittoClient {...manitto} />
    </AppShell>
  )
}
