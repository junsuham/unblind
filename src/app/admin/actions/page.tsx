import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminHeader, AdminListGroup, AdminListRow, AdminPageShell } from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

type ContentAction = { id: string; action_type: string; target_type: string; target_id: string; memo: string | null; admin_email: string | null; created_at: string }
type UserAction = { id: string; action_type: string; email: string; memo: string | null; admin_email: string | null; created_at: string }

const actionLabels: Record<string, string> = { hide: '콘텐츠 숨김', delete: '콘텐츠 삭제', restore: '콘텐츠 복구', dismiss: '신고 문제 없음', add: '사용자 승인', block: '사용자 차단', unblock: '차단 해제', reset_agreement: '동의 초기화', remove: '승인 목록 제거', update_memo: '메모 수정' }

export default async function AdminActionsPage() {
  await requireAdmin()
  const [{ data: contentActions }, { data: userActions }] = await Promise.all([
    supabaseAdmin.from('admin_actions').select('id, action_type, target_type, target_id, memo, admin_email, created_at').order('created_at', { ascending: false }).limit(100).returns<ContentAction[]>(),
    supabaseAdmin.from('admin_user_actions').select('id, action_type, email, memo, admin_email, created_at').order('created_at', { ascending: false }).limit(100).returns<UserAction[]>(),
  ])
  const items = [
    ...(contentActions ?? []).map((item) => ({ id: `content-${item.id}`, date: item.created_at, title: actionLabels[item.action_type] ?? item.action_type, subtitle: `${item.target_type} · ${item.target_id.slice(0, 8)} · ${item.admin_email ?? '관리자'}${item.memo ? ` · ${item.memo}` : ''}` })),
    ...(userActions ?? []).map((item) => ({ id: `user-${item.id}`, date: item.created_at, title: actionLabels[item.action_type] ?? item.action_type, subtitle: `${item.email} · ${item.admin_email ?? '관리자'}${item.memo ? ` · ${item.memo}` : ''}` })),
  ].sort((left, right) => Date.parse(right.date) - Date.parse(left.date)).slice(0, 150)

  return <AdminPageShell><AdminHeader eyebrow="감사 기록" title="운영 조치 이력" description="누가 언제 어떤 조치를 했는지 확인합니다." /><AdminListGroup title="최근 조치" footer="운영 조치 기록은 안전 운영과 내부 감사 목적으로만 사용하세요.">{items.map((item) => <AdminListRow key={item.id} title={item.title} subtitle={item.subtitle} trailing={<time className="ios-caption text-[var(--admin-text-tertiary)]">{new Date(item.date).toLocaleDateString('ko-KR')}</time>} />)}{!items.length && <p className="p-10 text-center ios-secondary">아직 조치 기록이 없습니다.</p>}</AdminListGroup></AdminPageShell>
}
