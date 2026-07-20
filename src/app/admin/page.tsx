import { requireAdmin } from '@/lib/adminAuth'
import { listAllAuthUsers } from '@/lib/adminUsers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminIcon, type AdminIconName } from './components/AdminIcon'
import {
  AdminListGroup,
  AdminListRow,
  AdminPageShell,
  AdminStatCard,
  AdminStatGrid,
} from './components/AdminIOS'
import { Emoji3D } from '@/app/components/ui/Emoji3D'

export const dynamic = 'force-dynamic'

type QueueItem = {
  href: string
  title: string
  subtitle: string
  icon: AdminIconName
  count: number
  tone: 'danger' | 'warning' | 'default'
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  const oneDayAgoDate = new Date()
  oneDayAgoDate.setDate(oneDayAgoDate.getDate() - 1)
  const oneDayAgo = oneDayAgoDate.toISOString()

  const [
    pendingReportsResult,
    staleReportsResult,
    visiblePostsResult,
    hiddenPostsResult,
    visibleCommentsResult,
    hiddenCommentsResult,
    allowedUsersResult,
    agreedUsersResult,
    accessEmailsResult,
    authUsersResult,
    recentPostsResult,
    recentCommentsResult,
    recentReportsResult,
    activeTrackResult,
    bannedWordsResult,
    manittoResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', oneDayAgo),
    supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visible'),
    supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'hidden'),
    supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visible'),
    supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'hidden'),
    supabaseAdmin
      .from('allowed_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin
      .from('allowed_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('agreed_at', 'is', null),
    supabaseAdmin.from('allowed_users').select('email'),
    listAllAuthUsers(),
    supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo),
    supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo),
    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo),
    supabaseAdmin
      .from('top100_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabaseAdmin
      .from('banned_words')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabaseAdmin
      .from('manitto_settings')
      .select('is_active')
      .eq('id', 1)
      .maybeSingle<{ is_active: boolean }>(),
  ])

  const accessEmails = new Set(
    (accessEmailsResult.data ?? []).map((row) => row.email.toLowerCase())
  )
  const pendingSignupCount = authUsersResult.users.filter(
    (user) => user.email && !accessEmails.has(user.email.toLowerCase())
  ).length

  const pendingReportCount = pendingReportsResult.count ?? 0
  const staleReportCount = staleReportsResult.count ?? 0
  const hiddenPostCount = hiddenPostsResult.count ?? 0
  const hiddenCommentCount = hiddenCommentsResult.count ?? 0
  const hiddenContentCount = hiddenPostCount + hiddenCommentCount

  const queue: QueueItem[] = []

  if (pendingReportCount > 0) {
    queue.push({
      href: '/admin/reports',
      title: '신고 검토',
      subtitle:
        staleReportCount > 0
          ? `24시간 넘은 신고 ${staleReportCount}건을 먼저 확인하세요.`
          : '새 신고 내용을 확인하고 처리 상태를 기록하세요.',
      icon: 'alert',
      count: pendingReportCount,
      tone: 'danger',
    })
  }

  if (pendingSignupCount > 0) {
    queue.push({
      href: '/admin/users',
      title: '가입 승인',
      subtitle: '가입 정보와 프로필을 확인한 뒤 승인하세요.',
      icon: 'users',
      count: pendingSignupCount,
      tone: 'warning',
    })
  }

  if (hiddenContentCount > 0) {
    queue.push({
      href: hiddenPostCount > 0 ? '/admin/posts' : '/admin/comments',
      title: '숨김 콘텐츠 점검',
      subtitle: `게시글 ${hiddenPostCount}건 · 댓글 ${hiddenCommentCount}건`,
      icon: 'shield',
      count: hiddenContentCount,
      tone: 'default',
    })
  }

  return (
    <AdminPageShell>
      <form action="/admin/search" className="mb-7 mt-1" role="search">
        <label
          htmlFor="admin-dashboard-search"
          className="sr-only"
        >
          관리자 통합 검색
        </label>
        <div className="admin-ios-card flex min-h-[52px] items-center gap-3 rounded-[16px] px-4">
          <AdminIcon
            name="search"
            className="h-5 w-5 shrink-0 text-[var(--admin-text-tertiary)]"
          />
          <input
            id="admin-dashboard-search"
            name="q"
            type="search"
            placeholder="사용자, 게시글, 댓글 검색"
            className="min-w-0 flex-1 bg-transparent text-[17px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-tertiary)]"
          />
        </div>
      </form>

      <AdminListGroup
        title={`우선 처리 ${queue.reduce((sum, item) => sum + item.count, 0)}`}
        footer="신고와 가입 승인을 우선 처리하면 운영 위험을 줄일 수 있습니다."
      >
        {queue.map((item) => (
          <AdminListRow
            key={item.href}
            href={item.href}
            title={item.title}
            subtitle={item.subtitle}
            leading={<AdminIcon name={item.icon} className="h-6 w-6" />}
            trailing={
              <span
                className={`min-w-7 rounded-full px-2 py-1 text-center text-[13px] font-bold ${
                  item.tone === 'danger'
                    ? 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]'
                    : item.tone === 'warning'
                      ? 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]'
                      : 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
                }`}
              >
                {item.count}
              </span>
            }
          />
        ))}

        {queue.length === 0 && (
          <AdminListRow
            title="모두 확인했습니다"
            subtitle="현재 즉시 처리해야 할 운영 항목이 없습니다."
            leading={<AdminIcon name="check" className="h-6 w-6" />}
          />
        )}
      </AdminListGroup>

      <section className="mb-7">
        <p className="mb-2 px-4 ios-caption font-semibold uppercase tracking-[0.04em] text-[var(--admin-text-tertiary)]">
          최근 24시간
        </p>
        <AdminStatGrid>
          <AdminStatCard label="새 글" value={recentPostsResult.count ?? 0} />
          <AdminStatCard
            label="새 댓글"
            value={recentCommentsResult.count ?? 0}
          />
          <AdminStatCard
            label="새 신고"
            value={recentReportsResult.count ?? 0}
            tone={(recentReportsResult.count ?? 0) > 0 ? 'danger' : 'default'}
          />
        </AdminStatGrid>
      </section>

      <AdminListGroup title="콘텐츠 관리">
        <AdminListRow
          href="/admin/posts"
          title="게시글"
          subtitle={`노출 ${visiblePostsResult.count ?? 0}건 · 숨김 ${hiddenPostCount}건`}
          leading={<AdminIcon name="post" className="h-6 w-6" />}
        />
        <AdminListRow
          href="/admin/comments"
          title="댓글"
          subtitle={`노출 ${visibleCommentsResult.count ?? 0}건 · 숨김 ${hiddenCommentCount}건`}
          leading={<AdminIcon name="comment" className="h-6 w-6" />}
        />
      </AdminListGroup>

      <AdminListGroup title="운영 상태">
        <AdminListRow
          href="/admin/account"
          title="계정·알림·차단 관리"
          subtitle="계정 설정과 알림, 차단 목록을 관리합니다."
          leading={<AdminIcon name="users" className="h-6 w-6" />}
        />
        <AdminListRow
          href="/admin/health"
          title="앱 상태 및 오류"
          subtitle="웹·앱 오류와 릴리스 상태를 확인합니다."
          leading={<AdminIcon name="chart" className="h-6 w-6" />}
        />
        <AdminListRow
          href="/admin/actions"
          title="운영 조치 이력"
          subtitle="사용자와 콘텐츠에 적용한 조치를 확인합니다."
          leading={<AdminIcon name="check" className="h-6 w-6" />}
        />
        <AdminListRow
          href="/admin/users"
          title="활성 사용자"
          subtitle={`약속 동의 ${agreedUsersResult.count ?? 0}명`}
          leading={<AdminIcon name="users" className="h-6 w-6" />}
          trailing={
            <strong className="text-[17px] text-[var(--admin-text)]">
              {allowedUsersResult.count ?? 0}
            </strong>
          }
        />
        <AdminListRow
          href="/admin/safety"
          title="자동 안전 필터"
          subtitle={`활성 금칙어 ${bannedWordsResult.count ?? 0}개`}
          leading={<AdminIcon name="shield" className="h-6 w-6" />}
          trailing={
            <span className="text-[13px] font-semibold text-[var(--admin-success)]">
              작동 중
            </span>
          }
        />
        <AdminListRow
          href="/admin/top100"
          title={<span className="inline-flex items-center gap-1.5"><Emoji3D name="musicDisc" size={22} />오・찬・추</span>}
          leading={<AdminIcon name="music" className="h-6 w-6" />}
          trailing={<strong className="text-[17px] text-[var(--admin-text)]">{activeTrackResult.count ?? 0}</strong>}
        />
        <AdminListRow
          href="/admin/manitto"
          title="마니또"
          subtitle={manittoResult.data?.is_active ? '현재 참여 기간입니다.' : '현재 운영하지 않습니다.'}
          leading={<AdminIcon name="gift" className="h-6 w-6" />}
          trailing={
            <span
              className={`text-[13px] font-semibold ${
                manittoResult.data?.is_active
                  ? 'text-[var(--admin-success)]'
                  : 'text-[var(--admin-text-tertiary)]'
              }`}
            >
              {manittoResult.data?.is_active ? 'ON' : 'OFF'}
            </span>
          }
        />
      </AdminListGroup>

      <div className="px-4 text-center ios-caption text-[var(--admin-text-tertiary)]">
        마지막 새로고침{' '}
        {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
      </div>

    </AdminPageShell>
  )
}
