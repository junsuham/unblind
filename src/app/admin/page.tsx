import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { listAllAuthUsers } from '@/lib/adminUsers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminLogoutButton from './components/AdminLogoutButton'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requireAdmin()

  const [
    pendingReportsResult,
    totalReportsResult,
    visiblePostsResult,
    totalPostsResult,
    visibleCommentsResult,
    totalCommentsResult,
    allowedUsersResult,
    agreedUsersResult,
    accessEmailsResult,
    authUsersResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true }),

    supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visible'),

    supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true }),

    supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visible'),

    supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true }),

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
  ])

  const accessEmails = new Set(
    (accessEmailsResult.data ?? []).map((row) => row.email.toLowerCase())
  )
  const pendingSignupCount = authUsersResult.users.filter(
    (user) => user.email && !accessEmails.has(user.email.toLowerCase())
  ).length

  const cards = [
    {
      label: '미처리 신고',
      value: pendingReportsResult.count ?? 0,
      href: '/admin/reports',
      tone: 'danger',
    },
    {
      label: '전체 신고',
      value: totalReportsResult.count ?? 0,
      href: '/admin/reports',
      tone: 'default',
    },
    {
      label: '가입 승인 대기',
      value: pendingSignupCount,
      href: '/admin/users',
      tone: 'danger',
    },
    {
      label: '승인 사용자',
      value: allowedUsersResult.count ?? 0,
      href: '/admin/users',
      tone: 'default',
    },
    {
      label: '약속 동의',
      value: agreedUsersResult.count ?? 0,
      href: '/admin/users',
      tone: 'default',
    },
    {
      label: '노출 글',
      value: visiblePostsResult.count ?? 0,
      href: '/admin/posts',
      tone: 'default',
    },
    {
      label: '전체 글',
      value: totalPostsResult.count ?? 0,
      href: '/admin/posts',
      tone: 'default',
    },
    {
      label: '노출 댓글',
      value: visibleCommentsResult.count ?? 0,
      href: '/admin/comments',
      tone: 'default',
    },
    {
      label: '전체 댓글',
      value: totalCommentsResult.count ?? 0,
      href: '/admin/comments',
      tone: 'default',
    },
  ]

  const quickLinks = [
    {
      href: '/admin/users',
      title: '베타 참여자 관리',
      description: '소셜 가입 승인, 차단, 동의 초기화',
      icon: '👥',
    },
    {
      href: '/admin/reports',
      title: '신고 목록 관리',
      description: '신고된 글과 댓글 확인 및 조치',
      icon: '🚩',
    },
    {
      href: '/admin/posts',
      title: '전체 게시글 관리',
      description: '게시글 숨김, 삭제, 복구',
      icon: '📝',
    },
    {
      href: '/admin/comments',
      title: '전체 댓글 관리',
      description: '댓글 숨김, 삭제, 복구',
      icon: '💬',
    },
    {
      href: '/admin/analytics',
      title: '베타 운영 통계',
      description: '최근 활동, 게시판별 글 수, 신고 사유 확인',
      icon: '📊',
    },
    {
      href: '/admin/manitto',
      title: '마니또 운영 관리',
      description: '참여 기간과 공개 정책 설정',
      icon: '🎁',
    },
    {
      href: '/admin/top100',
      title: 'TOP 100 관리',
      description: '찬양 순위와 곡 정보 편집',
      icon: '🎧',
    },
    {
      href: '/admin/safety',
      title: '안전 설정',
      description: '금칙어, 도배 제한, 자동 숨김 확인',
      icon: '🛡️',
    },
  ]

  return (
    <main className="ub-app-surface min-h-screen px-4 pb-10 pt-8 text-[var(--ub-text-on-brand-primary)]">
      <section className="mx-auto max-w-[430px]">
        <header className="mb-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[13px] font-semibold text-[var(--ub-text-on-brand-tertiary)]">
                운영자 전용
              </p>

              <h1 className="text-[34px] font-bold leading-[38px] tracking-[-0.7px] text-[var(--ub-text-on-brand-primary)]">
                관리자
              </h1>
            </div>

            <AdminLogoutButton />
          </div>

          <p className="text-[17px] leading-[25px] text-[var(--ub-text-on-brand-secondary)]">
            신고, 참여자, 게시글, 댓글 운영 상태를 확인합니다.
          </p>
        </header>

        <section className="mb-8">
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            운영 현황
          </p>

          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => (
              <Link key={card.label} href={card.href}>
                <div
                  className={
                    card.tone === 'danger' && card.value > 0
                      ? 'rounded-[24px] border border-[#FF3B30]/20 bg-[#FF3B30]/10 p-5 shadow-sm'
                      : 'rounded-[24px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 shadow-[var(--ub-shadow-card)] backdrop-blur-2xl'
                  }
                >
                  <p
                    className={
                      card.tone === 'danger' && card.value > 0
                        ? 'text-[15px] font-medium text-[#7A1A16]'
                        : 'text-[15px] font-medium text-[var(--ub-text-secondary)]'
                    }
                  >
                    {card.label}
                  </p>

                  <p className="mt-2 text-[34px] font-bold leading-[38px] tracking-[-0.7px] text-[var(--ub-text-primary)]">
                    {card.value}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
            관리 메뉴
          </p>

          <div className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block active:bg-[var(--ub-surface-pressed)]"
              >
                <div className="flex min-h-[72px] items-center gap-3 border-b border-[var(--ub-separator)] px-4 py-3 last:border-b-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--ub-surface-brand-soft)] text-[24px]">
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] leading-[22px] text-[var(--ub-text-primary)]">
                      {item.title}
                    </p>

                    <p className="mt-0.5 text-[15px] leading-[20px] text-[var(--ub-text-secondary)]">
                      {item.description}
                    </p>
                  </div>

                  <span className="text-[24px] leading-none text-[var(--ub-text-tertiary)]">
                    ›
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-6">
          <Link
            href="/"
            className="flex min-h-[52px] items-center justify-center rounded-[16px] bg-[#ffe2d2] px-5 text-[17px] font-semibold text-[#ff4b00] active:scale-[0.99]"
          >
            사용자 화면으로 이동
          </Link>
        </div>
      </section>
    </main>
  )
}
