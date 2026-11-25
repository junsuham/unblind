import type { Metadata } from 'next'
import { AppShell } from '@/app/components/ui/AppShell'
import ManittoMakerRoom from './ManittoMakerRoom'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '마니또 모임 | 언블라인드',
  description: '초대받은 마니또 모임에 참여하고 나만의 결과를 확인합니다.',
}

export default async function ManittoMakerRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <AppShell topTitle="마니또 모임" topBackHref="/manitto">
      <ManittoMakerRoom code={code} />
    </AppShell>
  )
}
