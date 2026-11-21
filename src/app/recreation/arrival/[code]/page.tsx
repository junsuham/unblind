import type { Metadata } from 'next'
import { AppShell } from '@/app/components/ui/AppShell'
import ArrivalRoom from '../ArrivalRoom'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '도착 시계 | 일찍 와주길 바래',
  description: '모임 도착 시간을 함께 확인하는 실시간 시계',
  robots: { index: false, follow: false },
}

export default async function ArrivalRoomPage({ params }: PageProps<'/recreation/arrival/[code]'>) {
  const { code } = await params
  return (
    <AppShell topTitle="도착 시계" topBackHref="/recreation">
      <ArrivalRoom code={code} />
    </AppShell>
  )
}
