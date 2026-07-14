import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireBetaUser } from '@/lib/betaAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import CommentForm from './CommentForm'
import PostViewTracker from './PostViewTracker'
import ReactionButtons from './ReactionButtons'
import ReportButton from './ReportButton'
import {
  AppShell,
  BottomTabBar,
  NoticeCard,
} from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

export const dynamic = 'force-dynamic'

const boardNames: Record<string, string> = {
  prayer: '기도요청',
  faith: '신앙고민',
  church: '교회생활',
  work: '진로/직장',
  relationship: '연애/결혼',
}

type PostDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

type ReactionRow = {
  type: 'pray' | 'empathize'
}

type CommentRow = {
  id: string
  content: string
  created_at: string
  author_user_id: string | null
}

function formatDate(value: string) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}.${month}.${day}`
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { supabase, user } = await requireBetaUser()

  const { id } = await params

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, board, title, content, created_at, author_user_id, view_count')
    .eq('id', id)
    .eq('status', 'visible')
    .single()

  if (postError || !post) {
    notFound()
  }

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, content, created_at, author_user_id')
    .eq('post_id', post.id)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })
    .returns<CommentRow[]>()

  const authorIds = Array.from(
    new Set(
      [post.author_user_id, ...(comments ?? []).map((comment) => comment.author_user_id)]
        .filter((value): value is string => !!value)
    )
  )

  const { data: authorProfiles } = authorIds.length
    ? await supabaseAdmin
        .from('user_profiles')
        .select('user_id, nickname')
        .in('user_id', authorIds)
        .returns<{ user_id: string; nickname: string }[]>()
    : { data: [] }

  const nicknameByUserId = new Map(
    (authorProfiles ?? []).map((profile) => [profile.user_id, profile.nickname])
  )
  const postNickname = post.author_user_id
    ? nicknameByUserId.get(post.author_user_id) ?? '익명'
    : '익명'

  const { data: reactions, error: reactionsError } = await supabase
    .from('reactions')
    .select('type')
    .eq('post_id', post.id)
    .returns<ReactionRow[]>()

  const prayCount =
    reactions?.filter((reaction) => reaction.type === 'pray').length ?? 0

  const empathizeCount =
    reactions?.filter((reaction) => reaction.type === 'empathize').length ?? 0

  const boardName = boardNames[post.board] ?? '게시판'
  const activeTab =
    post.board === 'prayer' ||
    post.board === 'faith' ||
    post.board === 'church' ||
    post.board === 'work' ||
    post.board === 'relationship'
      ? post.board
      : undefined

  return (
    <AppShell bottomBar={<BottomTabBar active={activeTab} />}>
      <PostViewTracker postId={post.id} />

      <article className="overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] shadow-[var(--ub-shadow-soft)]">
        <header className="px-5 pb-5 pt-4">
          <Link
            href={`/board/${post.board}`}
            className="inline-flex min-h-[36px] items-center text-[13px] font-medium text-[var(--ub-color-brand)]"
          >
            ‹ {boardName}
          </Link>

          <h1 className="mt-2 break-words text-[24px] font-bold leading-[32px] tracking-[-0.02em] text-[var(--ub-text-primary)]">
            {post.title}
          </h1>

          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="truncate text-[14px] font-semibold text-[var(--ub-color-brand)]">
              {postNickname}
            </p>

            <ReportButton
              targetType="post"
              targetId={post.id}
              reporterActorKey={user.id}
              label="신고"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--ub-text-tertiary)]">
            <time
              className="inline-flex items-center gap-1"
              dateTime={post.created_at}
            >
              <SystemIcon name="calendar" size={14} />
              {formatDate(post.created_at)}
            </time>
            <span className="inline-flex items-center gap-1">
              <SystemIcon name="eye" size={14} />
              조회 {(post.view_count ?? 0).toLocaleString('ko-KR')}
            </span>
            <span className="inline-flex items-center gap-1">
              <SystemIcon name="message" size={13} />
              댓글 {comments?.length ?? 0}
            </span>
          </div>
        </header>

        <div className="border-t border-[var(--ub-separator)] px-5 py-7">
          <p className="whitespace-pre-wrap text-[16px] leading-[26px] text-[var(--ub-text-primary)]">
            {post.content}
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--ub-surface-muted)] px-3 py-1.5 text-[12px] font-medium text-[var(--ub-text-secondary)]">
              #{boardName}
            </span>
          </div>
        </div>

        <ReactionButtons
          postId={post.id}
          initialPrayCount={prayCount}
          initialEmpathizeCount={empathizeCount}
          commentCount={comments?.length ?? 0}
        />
      </article>

      {reactionsError && (
        <div className="mt-5">
          <NoticeCard title="반응을 불러오지 못했습니다" tone="danger">
            <p>{reactionsError.message}</p>
          </NoticeCard>
        </div>
      )}

      <div id="comments" className="mt-6 scroll-mt-4">
        <CommentForm postId={post.id} />
      </div>

      <section className="mt-8">
        <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--ub-text-on-brand-tertiary)]">
          댓글 {comments?.length ?? 0}
        </p>

        {commentsError && (
          <div className="mb-4">
            <NoticeCard title="댓글을 불러오지 못했습니다" tone="danger">
              <p>{commentsError.message}</p>
            </NoticeCard>
          </div>
        )}

        <div className="space-y-3">
          {comments?.map((comment) => (
            <article
              key={comment.id}
              className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-4 shadow-[var(--ub-shadow-soft)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ub-text-primary)]">
                    {comment.author_user_id
                      ? nicknameByUserId.get(comment.author_user_id) ?? '익명'
                      : '익명'}
                  </p>

                  <p className="mt-0.5 text-[13px] text-[var(--ub-text-tertiary)]">
                    {formatDate(comment.created_at)}
                  </p>
                </div>

                <ReportButton
                  targetType="comment"
                  targetId={comment.id}
                  reporterActorKey={user.id}
                  label="댓글 신고"
                />
              </div>

              <p className="whitespace-pre-wrap text-[17px] leading-[25px] text-[var(--ub-text-primary)]">
                {comment.content}
              </p>
            </article>
          ))}

          {comments?.length === 0 && !commentsError && (
            <div className="rounded-[22px] bg-[var(--ub-surface-card-strong)] px-5 py-10 text-center shadow-[var(--ub-shadow-soft)]">
              <p className="text-[17px] font-semibold text-[var(--ub-text-primary)]">
                아직 댓글이 없습니다
              </p>

              <p className="mt-2 text-[15px] leading-[21px] text-[var(--ub-text-secondary)]">
                정답을 주기보다 함께 들어주는 첫 댓글을 남겨보세요.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mt-8">
        <Link
          href={`/board/${post.board}`}
          className="flex min-h-[52px] items-center justify-center rounded-[16px] bg-[var(--ub-surface-pressed)] px-5 text-[17px] font-semibold text-[var(--ub-color-brand)] active:scale-[0.99]"
        >
          {boardName}으로 돌아가기
        </Link>
      </div>
    </AppShell>
  )
}
