import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  AdminHeader,
  AdminListGroup,
  AdminListRow,
  AdminNotice,
  AdminPageShell,
  AdminStatCard,
  AdminStatGrid,
} from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

type AppEvent = {
  id: number
  source: 'web' | 'mobile' | 'server'
  severity: 'info' | 'warning' | 'error' | 'fatal'
  name: string
  message: string | null
  release: string | null
  route: string | null
  created_at: string
}

const severityLabel = {
  info: '정보',
  warning: '경고',
  error: '오류',
  fatal: '치명적 오류',
}

export default async function AdminHealthPage() {
  await requireAdmin()

  const oneDayAgoDate = new Date()
  oneDayAgoDate.setDate(oneDayAgoDate.getDate() - 1)
  const oneDayAgo = oneDayAgoDate.toISOString()
  const [eventsResult, rolesResult] = await Promise.all([
    supabaseAdmin
      .from('app_events')
      .select('id, source, severity, name, message, release, route, created_at')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<AppEvent[]>(),
    supabaseAdmin
      .from('admin_roles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])
  const events = eventsResult.data ?? []
  const errors = events.filter((event) => event.severity === 'error').length
  const fatals = events.filter((event) => event.severity === 'fatal').length
  const warnings = events.filter((event) => event.severity === 'warning').length

  return (
    <AdminPageShell>
      <AdminHeader
        eyebrow="운영 관측"
        title="앱 상태"
        description="최근 24시간의 클라이언트 오류와 서버 연결 상태입니다."
      />

      {eventsResult.error ? (
        <div className="mb-6">
          <AdminNotice title="관측 테이블 연결 필요" tone="warning">
            새 Supabase 마이그레이션을 적용하면 오류 기록이 이 화면에 표시됩니다.
          </AdminNotice>
        </div>
      ) : null}

      <section className="mb-7">
        <AdminStatGrid>
          <AdminStatCard label="치명적 오류" value={fatals} tone={fatals ? 'danger' : 'success'} />
          <AdminStatCard label="오류" value={errors} tone={errors ? 'danger' : 'success'} />
          <AdminStatCard label="경고" value={warnings} tone={warnings ? 'warning' : 'success'} />
          <AdminStatCard label="DB 연결" value={eventsResult.error ? '점검' : '정상'} tone={eventsResult.error ? 'warning' : 'success'} />
          <AdminStatCard label="활성 관리자" value={rolesResult.count ?? 0} />
          <AdminStatCard label="릴리스" value={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'} />
        </AdminStatGrid>
      </section>

      <AdminListGroup
        title="최근 이벤트"
        footer="민감한 사용자 입력과 인증 정보는 수집하지 않습니다."
      >
        {events.map((event) => (
          <AdminListRow
            key={event.id}
            title={`${severityLabel[event.severity]} · ${event.name}`}
            subtitle={`${event.source} · ${new Date(event.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}${event.route ? ` · ${event.route}` : ''}`}
            trailing={event.release ? <span className="text-[11px] text-[var(--admin-text-tertiary)]">{event.release.slice(0, 16)}</span> : undefined}
          >
            {event.message ? (
              <p className="break-words rounded-[14px] bg-[var(--ub-surface-muted)] p-3 text-[13px] text-[var(--admin-text-secondary)]">
                {event.message}
              </p>
            ) : null}
          </AdminListRow>
        ))}
        {!events.length ? (
          <AdminListRow title="기록된 문제가 없습니다" subtitle="최근 24시간 동안 수집된 오류가 없습니다." />
        ) : null}
      </AdminListGroup>
    </AdminPageShell>
  )
}
