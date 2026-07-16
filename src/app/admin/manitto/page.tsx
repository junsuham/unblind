import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminHeader, AdminPageShell, AdminStatCard, AdminStatGrid } from '@/app/admin/components/AdminIOS'
import ManittoSettingsForm from './ManittoSettingsForm'

export const dynamic = 'force-dynamic'
export default async function AdminManittoPage() {
  await requireAdmin()
  const [{ data: settings }, { count }] = await Promise.all([
    supabaseAdmin.from('manitto_settings').select('is_active, starts_on, ends_on, reveal_enabled').eq('id', 1).single(),
    supabaseAdmin.from('manitto_participants').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])
  const safeSettings = settings ?? { is_active: false, starts_on: null, ends_on: null, reveal_enabled: false }
  return <AdminPageShell><AdminHeader title="마니또 관리" description="참여 기간과 공개 정책을 설정합니다." /><AdminStatGrid><AdminStatCard label="참여자" value={count ?? 0} /><AdminStatCard label="운영" value={safeSettings.is_active ? 'ON' : 'OFF'} /><AdminStatCard label="공개" value={safeSettings.reveal_enabled ? '허용' : '비공개'} /></AdminStatGrid><div className="mt-6"><ManittoSettingsForm settings={safeSettings} /></div></AdminPageShell>
}
