import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import {
  formatRelativeTime,
  getAnonymousId,
  getBoardPresentation,
} from '@/lib/communityPresentation'
import { AppShell, BottomTabBar, NoticeCard } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import { HomePraisePlayer } from '@/app/components/HomePraisePlayer'
import { HomeManittoFinder } from '@/app/components/HomeManittoFinder'
import { HomeBibleVerse } from '@/app/components/HomeBibleVerse'
import { BuilderHomeSection } from '@/app/components/builder/BuilderHomeSection'
import { getWeeklyManitto } from '@/lib/manitto'
import { UrgentPrayerBadge } from '@/app/components/UrgentPrayerBadge'
import { isUrgentPrayerPost } from '@/lib/urgentPrayer'

export const dynamic = 'force-dynamic'

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type FeedPost = {
  id: string
  author_user_id: string | null
  board: string
  title: string
  content: string
  created_at: string
  view_count: number
  tags: string[] | null
  comments: { count: number }[]
  reactions: { type: 'pray' | 'empathize' }[]
}

type HomePraiseRow = {
  youtube_id: string
  title: string
  artist: string
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { supabase, user } = await requireBetaUser()
  const params = await searchParams
  const sort = params.sort === 'popular' ? 'popular' : 'latest'

  let postsQuery = supabase
    .from('posts')
    .select(`
      id,
      author_user_id,
      board,
      title,
      content,
      created_at,
      view_count,
      tags,
      comments(count),
      reactions(type)
    `)
    .eq('status', 'visible')

  postsQuery = sort === 'popular'
    ? postsQuery
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false })
    : postsQuery.order('created_at', { ascending: false })

  const [
    { data: posts, error },
    { data: blockedRows },
    { data: praiseTracks },
    manitto,
  ] = await Promise.all([
    postsQuery.limit(30).returns<FeedPost[]>(),
    supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('blocker_user_id', user.id),
    supabase
      .from('top100_tracks')
      .select('youtube_id, title, artist')
      .eq('is_active', true)
      .order('rank', { ascending: true })
      .limit(10)
      .returns<HomePraiseRow[]>(),
    getWeeklyManitto(user.id),
  ])

  const blockedIds = new Set(
    (blockedRows ?? []).map((item) => item.blocked_user_id)
  )
  const visiblePosts = (posts ?? []).filter(
    (post) => !post.author_user_id || !blockedIds.has(post.author_user_id)
  )

  return (
    <AppShell bottomBar={<BottomTabBar active="home" />}>
      <HomeBibleVerse />

      <BuilderHomeSection searchParams={params} />

      <section className="mb-4" aria-labelledby="unblind-app-shortcuts">
        <p id="unblind-app-shortcuts" className="mb-1.5 px-1 text-[9px] font-bold tracking-[0.08em] text-white/58">언블라인드 앱</p>
        <div className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
          <HomeManittoFinder initialState={manitto} />
          <Link
            href="/recreation"
            className="flex min-h-[68px] w-full items-center gap-3 border-t border-[var(--ub-separator)] px-4 py-3 text-left text-[var(--ub-text-primary)] active:bg-[var(--ub-surface-pressed)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
              <SystemIcon name="dice" size={21} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold tracking-[-0.2px]">레크레이션 KIT</span>
              <span className="mt-0.5 block truncate text-[11px] text-[var(--ub-text-secondary)]">
                상황별 게임 추천 · 팀 편성 · 타이머 · 점수판
              </span>
            </span>
            <span className="text-[22px] leading-none text-[var(--ub-text-tertiary)]" aria-hidden>›</span>
          </Link>
          <Link
            href="/mbti"
            className="flex min-h-[68px] w-full items-center gap-3 border-t border-[var(--ub-separator)] px-4 py-3 text-left text-[var(--ub-text-primary)] active:bg-[var(--ub-surface-pressed)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]">
              <SystemIcon name="sparkles" size={21} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold tracking-[-0.2px]">성경 인물 MBTI</span>
              <span className="mt-0.5 block truncate text-[11px] text-[var(--ub-text-secondary)]">
                나와 닮은 성경 속 믿음의 인물 찾기
              </span>
            </span>
            <span className="text-[22px] leading-none text-[var(--ub-text-tertiary)]" aria-hidden>›</span>
          </Link>
          <HomePraisePlayer
            initialTracks={(praiseTracks ?? []).map((track) => ({
              id: track.youtube_id,
              title: track.title,
              artist: track.artist,
            }))}
          />
        </div>
      </section>

      <section
        aria-label={sort === 'popular' ? '인기 게시글' : '최신 게시글'}
        className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]"
      >
        <nav
          aria-label="게시글 정렬"
          className="flex items-center gap-1.5 border-b border-[var(--ub-separator)] px-4 py-3"
        >
          <Link
            href="/?sort=latest"
            aria-current={sort === 'latest' ? 'page' : undefined}
            className={sort === 'latest'
              ? 'flex min-h-[30px] min-w-[58px] items-center justify-center whitespace-nowrap rounded-[10px] bg-[var(--ub-color-brand)] px-3 text-[11px] font-bold leading-none text-white shadow-sm'
              : 'flex min-h-[30px] min-w-[58px] items-center justify-center whitespace-nowrap rounded-[10px] bg-[var(--ub-surface-muted)] px-3 text-[11px] font-semibold leading-none text-[var(--ub-text-secondary)]'}
          >
            최신순
          </Link>
          <Link
            href="/?sort=popular"
            aria-current={sort === 'popular' ? 'page' : undefined}
            className={sort === 'popular'
              ? 'flex min-h-[30px] min-w-[58px] items-center justify-center whitespace-nowrap rounded-[10px] bg-[var(--ub-color-brand)] px-3 text-[11px] font-bold leading-none text-white shadow-sm'
              : 'flex min-h-[30px] min-w-[58px] items-center justify-center whitespace-nowrap rounded-[10px] bg-[var(--ub-surface-muted)] px-3 text-[11px] font-semibold leading-none text-[var(--ub-text-secondary)]'}
          >
            인기순
          </Link>
        </nav>

        {error && (
          <div className="p-4">
            <NoticeCard title="글을 불러오지 못했습니다" tone="danger">
              잠시 후 다시 확인해주세요.
            </NoticeCard>
          </div>
        )}

        {visiblePosts.map((post) => {
          const board = getBoardPresentation(post.board)
          const commentCount = post.comments?.[0]?.count ?? 0
          const empathizeCount = post.reactions?.filter(
            (reaction) => reaction.type === 'empathize'
          ).length ?? 0
          const preview = post.content.length > 130
            ? `${post.content.slice(0, 130)}…`
            : post.content
          const isUrgent = isUrgentPrayerPost(post.board, post.tags)

          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block border-b border-[var(--ub-separator)] px-4 py-5 last:border-b-0 active:bg-[var(--ub-surface-pressed)]"
            >
              <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--ub-text-tertiary)]">
                <Emoji3D name={board.icon} size={19} />
                <span className="font-semibold text-[var(--ub-text-secondary)]">{board.name}</span>
                <span>·</span>
                <time dateTime={post.created_at}>{formatRelativeTime(post.created_at)}</time>
                <span>·</span>
                <span className="truncate">{getAnonymousId(post.id, post.author_user_id)}</span>
              </div>

              <div className="mt-3 flex min-w-0 items-center gap-2">
                {isUrgent && <UrgentPrayerBadge compact />}
                <h2 className="min-w-0 break-words text-[18px] font-bold leading-[25px] tracking-[-0.02em] text-[var(--ub-text-primary)]">{post.title}</h2>
              </div>
              <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-[14px] leading-[21px] text-[var(--ub-text-secondary)]">
                {preview}
              </p>

              <div className="mt-4 flex items-center gap-5 text-[12px] text-[var(--ub-text-tertiary)]">
                <span className="inline-flex items-center gap-1.5">
                  <SystemIcon name="heart" size={17} />
                  {empathizeCount}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <SystemIcon name="message" size={17} />
                  {commentCount}
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5">
                  <SystemIcon name="eye" size={17} />
                  {(post.view_count ?? 0).toLocaleString('ko-KR')}
                </span>
              </div>
            </Link>
          )
        })}

        {visiblePosts.length === 0 && !error && (
          <div className="px-5 py-14 text-center">
            <p className="text-[17px] font-bold text-[var(--ub-text-primary)]">
              아직 게시글이 없습니다
            </p>
            <Link
              href="/post/new"
              className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--ub-color-brand)]"
            >
              첫 이야기 남기기
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  )
}
