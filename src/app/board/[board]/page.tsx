import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import {
  AppShell,
  BottomTabBar,
  NoticeCard,
  PageHeader,
  PrimaryLink,
} from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

export const dynamic = 'force-dynamic'

const boardNames: Record<string, string> = {
  prayer: '🙏 기도요청',
  faith: '🕊️ 신앙',
  daily: '☀️ 일상',
  church: '⛪ 교회생활',
  work: '🌱 진로/직장',
  relationship: '💞 연애/결혼',
}

const boardDescriptions: Record<string, string> = {
  prayer: '함께 기도받고 싶은 제목을 조용히 나누는 공간입니다.',
  faith: '신앙 속 고민을 안전하게 나눕니다.',
  daily: '일상 속 고민을 편안하게 나눕니다.',
  church: '공동체, 봉사, 소그룹, 교회생활 고민을 나눕니다.',
  work: '학업, 취업, 직장, 소명에 대한 고민을 나눕니다.',
  relationship: '관계와 결혼에 대한 고민을 안전하게 나눕니다.',
}

type BoardPageProps = {
  params: Promise<{
    board: string
  }>
}

type PostRow = {
  id: string
  board: string
  title: string
  content: string
  created_at: string
  view_count: number
  comments: { count: number }[]
  reactions: { type: 'pray' | 'empathize' }[]
}

function formatCompactDate(value: string) {
  const date = new Date(value)
  const now = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return date.getFullYear() === now.getFullYear()
    ? `${month}.${day}`
    : `${date.getFullYear()}.${month}.${day}`
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { supabase } = await requireBetaUser()

  const { board } = await params
  const boardName = boardNames[board] ?? '게시판'
  const boardDescription = boardDescriptions[board] ?? '익명으로 고민을 나누는 공간입니다.'

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
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
    .order('created_at', { ascending: false })
    .returns<PostRow[]>()

  const activeTab =
    board === 'prayer' ||
    board === 'faith' ||
    board === 'daily'
      ? board
      : undefined

  return (
    <AppShell bottomBar={<BottomTabBar active={activeTab} />}>
      <PageHeader
        eyebrow="언블라인드"
        title={boardName}
        titleSize="compact"
        description={boardDescription}
      />

      <div className="mb-5">
        <PrimaryLink href={`/post/new?board=${board}`}>
          이 게시판에 글쓰기
        </PrimaryLink>
      </div>

      {error && (
        <div className="mb-5">
          <NoticeCard title="글을 불러오지 못했습니다" tone="danger">
            <p>{error.message}</p>
          </NoticeCard>
        </div>
      )}

      <section>
        <p className="mb-2 px-1 text-[12px] font-semibold text-[var(--ub-text-tertiary)]">
          최근 글
        </p>

        <div className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
          {posts?.map((post) => {
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
                    <span className="text-[14px] leading-none" aria-hidden>
                      🙏
                    </span>
                    {prayCount}
                  </span>
                  <span
                    className="inline-flex items-center gap-1"
                    aria-label={`댓글 ${commentCount}`}
                  >
                    <SystemIcon name="message" size={14} />
                    {commentCount}
                  </span>
                  <time
                    className="ml-auto whitespace-nowrap"
                    dateTime={post.created_at}
                  >
                    {formatCompactDate(post.created_at)}
                  </time>
                </div>
              </Link>
            )
          })}

          {posts?.length === 0 && !error && (
            <div className="px-4 py-10 text-center">
              <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
                아직 글이 없습니다
              </p>

              <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
                첫 번째 고민이나 기도제목을 조용히 나눠보세요.
              </p>

              <Link
                href={`/post/new?board=${board}`}
                className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#ff4b00] px-5 text-[15px] font-semibold text-white"
              >
                첫 글 쓰기
              </Link>
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
