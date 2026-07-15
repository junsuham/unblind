import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminHeader, AdminPageShell } from '@/app/admin/components/AdminIOS'
import SafetyManager from './SafetyManager'

export const dynamic = 'force-dynamic'
export default async function AdminSafetyPage() { await requireAdmin(); const { data } = await supabaseAdmin.from('banned_words').select('id, word').eq('is_active', true).order('word'); return <AdminPageShell><AdminHeader backHref="/admin" title="안전 설정" description="금칙어와 자동 보호 정책을 관리합니다." /><SafetyManager words={data ?? []} /></AdminPageShell> }
