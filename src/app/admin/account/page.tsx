import AccountSettings from '@/app/settings/account/AccountSettings'
import { requireAdmin } from '@/lib/adminAuth'
import { AdminHeader, AdminPageShell } from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

export default async function AdminAccountPage() {
  await requireAdmin()

  return (
    <AdminPageShell>
      <AdminHeader
        eyebrow="관리자 설정"
        title="계정·알림·차단"
      />
      <AccountSettings />
    </AdminPageShell>
  )
}
