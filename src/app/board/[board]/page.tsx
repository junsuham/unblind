import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import {
  AppShell,
  BottomTabBar,
  NoticeCard,
} from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import {
  formatRelativeTime,
  getAnonymousId,
  getBoardPresentation,
} from '@/lib/communityPresentation'

export const dynamic = 'force-dynamic'

const boardNames: Record<string, string> = {
  prayer: '기도요청',
  faith: '신앙고민',
  daily: '일상고민',
  church: '교회생활',
  work: '일상고민',
  relationship: '연애/결혼',
}

type BoardPageProps = {
  params: Promise<{
    board: string
  }>
  searchParams: Promise<{
    sort?: string
  }>
}

type PostRow = {
  id: string
  author_user_id: string | null
  board: string
  title: string
  content: string
  created_at: string
  view_count: number
  comments: { count: number }[]
  reactions: { type: 'pray' | 'empathize' }[]
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { supabase, user } = await requireBetaUser()

  const { board } = await params
  const filters = await searchParams
  const sort = filters.sort === 'popular' ? 'popular' : 'latest'
  const boardName = boardNames[board] ?? '게시판'

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
      comments(count),
      reactions(type)
    `)
    .eq('board', board)
    .eq('status', 'visible')

  postsQuery = sort === 'popular'
    ? postsQuery.order('view_count', { ascending: false }).order('created_at', { ascending: false })
    : postsQuery.order('created_at', { ascending: false })

  const [{ data: posts, error }, { data: blockedRows }] = await Promise.all([
    postsQuery.limit(50).returns<PostRow[]>(),
    supabase.from('user_blocks').select('blocked_user_id').eq('blocker_user_id', user.id),
  ])
  const blockedIds = new Set((blockedRows ?? []).map((item) => item.blocked_user_id))
  const visiblePosts = (posts ?? []).filter((post) => !post.author_user_id || !blockedIds.has(post.author_user_id)).slice(0, 50)

  const activeTab =
    board === 'prayer' ||
    board === 'faith' ||
    board === 'daily'
      ? board
      : undefined

  return (
    <AppShell topTitle={boardName} bottomBar={<BottomTabBar active={activeTab} />}>
      <form method="get" className="mb-4 flex justify-end">
        <select name="sort" defaultValue={sort} className="min-h-12 rounded-[16px] border-0 bg-[var(--ub-surface-card-strong)] px-3 text-[13px] text-[var(--ub-text-primary)] shadow-sm">
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
        <button type="submit" className="sr-only">정렬 적용</button>
      </form>

      {error && (
        <div className="mb-5">
          <NoticeCard title="글을 불러오지 못했습니다" tone="danger">
            <p>연결을 확인한 뒤 다시 시도해주세요.</p>
          </NoticeCard>
        </div>
      )}

      <section>
        <p className="mb-2 px-1 text-[12px] font-semibold text-[var(--ub-text-tertiary)]">
          최근 글
        </p>

        <div className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
          {visiblePosts.map((post) => {
            const postBoard = getBoardPresentation(post.board)
            const commentCount = post.comments?.[0]?.count ?? 0
            const likeCount =
              post.reactions?.filter(
                (reaction) => reaction.type === 'empathize'
              ).length ?? 0
            const prayCount =
              post.reactions?.filter((reaction) => reaction.type === 'pray')
                .length ?? 0
            const preview =
              post.content.length > 100
                ? `${post.content.slice(0, 100)}…`
                : post.content

            return (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block border-b border-[var(--ub-separator)] px-4 py-4 last:border-b-0 active:bg-[var(--ub-surface-pressed)]"
              >
                <div className="mb-2 flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--ub-text-tertiary)]">
                  <Emoji3D name={postBoard.icon} size={18} />
                  <span className="font-semibold text-[var(--ub-text-secondary)]">{postBoard.name}</span>
                  <span>·</span>
                  <time dateTime={post.created_at}>{formatRelativeTime(post.created_at)}</time>
                  <span>·</span>
                  <span className="truncate">{getAnonymousId(post.id, post.author_user_id)}</span>
                </div>
                <h2 className="truncate text-[16px] font-semibold leading-[22px] text-[var(--ub-text-primary)]">
                  {post.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-[13px] leading-[19px] text-[var(--ub-text-secondary)]">
                  {preview}
                </p>

                <div className="mt-3 flex items-center gap-3 text-[12px] text-[var(--ub-text-tertiary)]">
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`조회수 ${post.view_count ?? 0}`}
                  >
                    <SystemIcon name="eye" size={15} />
                    {(post.view_count ?? 0).toLocaleString('ko-KR')}
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`좋아요 ${likeCount}`}
                  >
                    <SystemIcon name="heart" size={14} />
                    {likeCount}
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`기도 ${prayCount}`}
                  >
                    <Emoji3D name="prayer" size={17} />
                    {prayCount}
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`댓글 ${commentCount}`}
                  >
                    <SystemIcon name="message" size={14} />
                    {commentCount}
                  </span>
                </div>
              </Link>
            )
          })}

          {visiblePosts.length === 0 && !error && (
            <div className="px-4 py-10 text-center">
              <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
                아직 글이 없습니다
              </p>

              <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
                첫 번째 고민이나 기도제목을 조용히 나눠보세요.
              </p>

            </div>
          )}
        </div>

        <p className="mt-3 px-1 text-[12px] leading-[18px] text-[var(--ub-text-tertiary)]">
          작성자 정보는 다른 사용자에게 공개되지 않습니다.
        </p>
      </section>
    </AppShell>
  )
}
