import Link from 'next/link'
import Image from 'next/image'
import { requireBetaUser } from '@/lib/betaAuth'
import { getRandomBibleVerse } from '@/lib/bibleVerses'
import LogoutButton from '@/app/components/LogoutButton'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { isAdminEmail } from '@/lib/adminIdentity'
import {
  AppShell,
  BottomTabBar,
  GlassCard,
  IosListGroup,
  IosListRow,
  NoticeCard,
} from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

const boardNames: Record<string, string> = {
  prayer: '🙏 기도요청',
  faith: '🕊️ 신앙',
  daily: '☀️ 일상',
  church: '⛪ 교회생활',
  work: '🌱 진로/직장',
  relationship: '💞 연애/결혼',
}

type PopularPost = {
  id: string
  author_user_id: string | null
  board: string
  title: string
  content: string
  view_count: number
  comments: { count: number }[]
}

export default async function HomePage() {
  const { supabase, user } = await requireBetaUser()
  const verse = getRandomBibleVerse()

  const [{ data: popularPosts, error }, { count: unreadCount }, { data: blockedRows }] = await Promise.all([
    supabase
    .from('posts')
    .select(`
      id,
      author_user_id,
      board,
      title,
      content,
      view_count,
      comments(count)
    `)
    .eq('status', 'visible')
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<PopularPost[]>(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null),
    supabase.from('user_blocks').select('blocked_user_id').eq('blocker_user_id', user.id),
  ])
  const blockedIds = new Set((blockedRows ?? []).map((item) => item.blocked_user_id))
  const visiblePopularPosts = (popularPosts ?? []).filter((post) => !post.author_user_id || !blockedIds.has(post.author_user_id)).slice(0, 5)

  return (
    <AppShell showTopLogo={false} bottomBar={<BottomTabBar />}>
      <section className="-mx-4 -mt-[calc(18px+env(safe-area-inset-top))] mb-6 bg-[var(--ub-surface-logo)] px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-3">
        <div className="mx-auto flex max-w-[430px] items-center justify-between">
          <Link
            href="/"
            aria-label="언블라인드 홈"
            className="inline-flex active:scale-[0.99]"
          >
            <Image
              src="/unblind-logo.png"
              alt="UNBLIND"
              width={84}
              height={84}
              className="block h-[84px] w-[84px]"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/notifications" aria-label={`알림 ${unreadCount ?? 0}개`} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ub-surface-card)] text-[var(--ub-color-brand)] shadow-sm">
              <SystemIcon name="bell" size={21} />
              {(unreadCount ?? 0) > 0 && <span className="absolute right-0 top-0 min-w-5 rounded-full bg-[#FF3B30] px-1 text-center text-[10px] font-bold leading-5 text-white">{Math.min(unreadCount ?? 0, 99)}</span>}
            </Link>
            {isAdminEmail(user.email) && (
              <Link href="/admin" className="flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--ub-surface-card)] px-3 text-[12px] font-semibold text-[var(--ub-color-brand)] shadow-sm">
                <SystemIcon name="people" size={16} />
                관리자
              </Link>
            )}
            <Link href="/activity" className="flex min-h-11 items-center rounded-full bg-[var(--ub-surface-card)] px-3 text-[12px] font-semibold text-[var(--ub-color-brand)] shadow-sm">내 활동</Link>
            <LogoutButton compact />
          </div>
        </div>
      </section>

      <GlassCard>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--ub-color-brand)]">
          오늘의 말씀
        </p>

        <blockquote className="mt-3 ios-body text-[var(--ub-text-primary)]">
          “{verse.text}”
        </blockquote>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ub-separator)] pt-3">
          <cite className="not-italic text-[14px] font-semibold text-[var(--ub-text-secondary)]">
            {verse.reference}
          </cite>

          <span className="text-[11px] text-[var(--ub-text-tertiary)]">
            한국어 성경 1910 · Public Domain
          </span>
        </div>
      </GlassCard>

      <div className="mt-7">
        {error && (
          <div className="mb-5">
            <NoticeCard title="인기글을 불러오지 못했습니다" tone="danger">
              <p>잠시 후 다시 확인해주세요.</p>
            </NoticeCard>
          </div>
        )}

        <IosListGroup title="인기글" footer="조회수가 높은 글부터 보여드립니다.">
          {visiblePopularPosts.map((post) => {
            const commentCount = post.comments?.[0]?.count ?? 0
            const preview =
              post.content.length > 58
                ? `${post.content.slice(0, 58)}...`
                : post.content

            return (
              <IosListRow
                key={post.id}
                href={`/post/${post.id}`}
                title={post.title}
                subtitle={`${boardNames[post.board] ?? '게시판'} · ${preview}`}
                trailing={
                  <span className="whitespace-nowrap text-[12px]">
                    조회 {post.view_count ?? 0} · 댓글 {commentCount}
                  </span>
                }
              />
            )
          })}

          {visiblePopularPosts.length === 0 && !error && (
            <div className="px-5 py-10 text-center">
              <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
                아직 인기글이 없습니다
              </p>

              <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
                게시판에서 첫 이야기를 나눠보세요.
              </p>
            </div>
          )}
        </IosListGroup>
      </div>

      <GlassCard>
        <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
          오늘의 사용 원칙
        </p>

        <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
          정답을 주기보다 들어주고, 판단하기보다 기도하고, 누군가를
          특정하기보다 내 마음과 고민을 중심으로 나눠주세요.
        </p>

        <Link
          href="/onboarding"
          className="mt-4 inline-flex min-h-11 items-center text-[15px] font-medium text-[var(--ub-color-brand)]"
        >
          커뮤니티 약속 다시 보기
        </Link>
      </GlassCard>
    </AppShell>
  )
}
