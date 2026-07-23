import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'
import AccountSettings from './AccountSettings'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '계정 관리 | 언블라인드',
  description: '알림, 차단, 신고, 개인정보와 계정 삭제를 관리합니다.',
}

export default async function AccountSettingsPage() {
  await requireBetaUser()
  return <AppShell bottomBar={<BottomTabBar />}><PageHeader eyebrow="내 정보" title="계정 관리" titleSize="compact" description="알림, 차단, 신고 처리와 개인정보를 관리합니다." /><AccountSettings /></AppShell>
}
