import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell } from '@/app/components/ui/AppShell'
import ArrivalCreate from './ArrivalCreate'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '일찍 와주길 바래 | 모임 KIT',
  description: '약속 시간과 도착 시각이 함께 보이는 모임 시계',
}

export default async function ArrivalCreatePage() {
  await requireBetaUser()
  return (
    <AppShell topTitle="일찍 와주길 바래" topBackHref="/recreation">
      <ArrivalCreate />
    </AppShell>
  )
}
