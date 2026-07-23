import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  AdminHeader,
  AdminNotice,
  AdminPageShell,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminIOS'
import SupportRequestActions from './SupportRequestActions'

export const dynamic = 'force-dynamic'

type SupportRequestRow = {
  id: string
  user_id: string | null
  email: string
  category: string
  message: string
  source: string
  status: string
  resolution_note: string | null
  created_at: string
  updated_at: string
}

const categoryLabels: Record<string, string> = {
  account: '계정·로그인',
  approval: '가입 승인',
  privacy: '개인정보·권리 행사',
  safety: '신고·안전',
  technical: '기술 문제',
  other: '기타',
}

const statusLabels: Record<string, string> = {
  open: '미처리',
  in_progress: '처리 중',
  resolved: '답변 완료',
  closed: '종결',
}

export default async function AdminSupportPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('support_requests')
    .select(
      'id, user_id, email, category, message, source, status, resolution_note, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<SupportRequestRow[]>()

  const requests = [...(data ?? [])].sort((left, right) => {
    const order: Record<string, number> = {
      open: 0,
      in_progress: 1,
      resolved: 2,
      closed: 3,
    }
    return (
      (order[left.status] ?? 4) - (order[right.status] ?? 4) ||
      Date.parse(right.created_at) - Date.parse(left.created_at)
    )
  })
  const openCount = requests.filter((item) => item.status === 'open').length
  const progressCount = requests.filter(
    (item) => item.status === 'in_progress',
  ).length
  const closedCount = requests.filter((item) =>
    ['resolved', 'closed'].includes(item.status),
  ).length

  return (
    <AdminPageShell>
      <AdminHeader
        eyebrow="고객지원"
        title="문의 접수함"
        description="계정, 개인정보, 신고, 기술 문의를 확인하고 처리 기록을 남깁니다."
      />

      <div className="mb-5">
        <AdminNotice title="개인정보 주의" tone="warning">
          이메일과 문의 내용은 답변과 권리 행사 처리에만 사용하고 외부에 공유하지
          마세요.
        </AdminNotice>
      </div>

      <section className="mb-6">
        <AdminStatGrid>
          <AdminStatCard
            label="미처리"
            value={openCount}
            tone={openCount ? 'danger' : 'success'}
          />
          <AdminStatCard
            label="처리 중"
            value={progressCount}
            tone={progressCount ? 'warning' : 'default'}
          />
          <AdminStatCard label="완료" value={closedCount} />
        </AdminStatGrid>
      </section>

      {error && (
        <AdminNotice title="목록을 불러오지 못했습니다" tone="danger">
          데이터베이스 연결을 확인한 뒤 다시 열어주세요.
        </AdminNotice>
      )}

      <div className="space-y-4">
        {requests.map((item) => (
          <article key={item.id} className="admin-ios-card rounded-[22px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="ios-caption font-semibold text-[var(--admin-accent)]">
                  {categoryLabels[item.category] ?? item.category}
                </p>
                <h2 className="mt-1 truncate text-[17px] font-bold text-[var(--admin-text)]">
                  {item.email}
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--admin-accent-soft)] px-2.5 py-1 text-[12px] font-bold text-[var(--admin-accent)]">
                {statusLabels[item.status] ?? item.status}
              </span>
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-6 text-[var(--admin-text-secondary)]">
              {item.message}
            </p>
            <p className="mt-3 text-[12px] text-[var(--admin-text-tertiary)]">
              {new Date(item.created_at).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
              })}
              {' · '}
              {item.user_id ? '로그인 사용자' : '비로그인 문의'}
            </p>

            <SupportRequestActions
              id={item.id}
              currentStatus={item.status}
              currentNote={item.resolution_note}
            />
          </article>
        ))}

        {!error && requests.length === 0 && (
          <div className="admin-ios-card rounded-[22px] p-10 text-center ios-secondary text-[var(--admin-text-secondary)]">
            접수된 문의가 없습니다.
          </div>
        )}
      </div>
    </AdminPageShell>
  )
}
