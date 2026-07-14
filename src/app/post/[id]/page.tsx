import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireBetaUser } from '@/lib/betaAuth'
import CommentForm from './CommentForm'
import ReactionButtons from './ReactionButtons'
import ReportButton from './ReportButton'
import {
  AppShell,
  BottomTabBar,
  GlassCard,
  NoticeCard,
  PageHeader,
} from '@/app/components/ui/AppShell'

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

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { supabase, user } = await requireBetaUser()

  const { id } = await params

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, board, title, content, created_at')
    .eq('id', id)
    .eq('status', 'visible')
    .single()

  if (postError || !post) {
    notFound()
  }

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, content, created_at')
    .eq('post_id', post.id)
    .eq('status', 'visible')
    .order('created_at', { ascending: true })

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
      <PageHeader
        backHref={`/board/${post.board}`}
        backLabel={boardName}
        eyebrow="언블라인드"
        title={post.title}
        description={`익명 작성자 · ${boardName} · ${formatDate(post.created_at)}`}
      />

      <GlassCard className="p-0">
        <article className="px-5 py-5">
          <p className="whitespace-pre-wrap text-[17px] leading-[27px] text-[var(--ub-text-primary)]">
            {post.content}
          </p>
        </article>

        <div className="border-t border-[var(--ub-separator)] px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] leading-[18px] text-[var(--ub-text-secondary)]">
              사용자에게는 익명으로 표시됩니다.
            </p>

            <ReportButton
              targetType="post"
              targetId={post.id}
              reporterActorKey={user.id}
              label="글 신고"
            />
          </div>
        </div>
      </GlassCard>

      {reactionsError && (
        <div className="mt-5">
          <NoticeCard title="반응을 불러오지 못했습니다" tone="danger">
            <p>{reactionsError.message}</p>
          </NoticeCard>
        </div>
      )}

      <div className="mt-6">
        <ReactionButtons
          postId={post.id}
          initialPrayCount={prayCount}
          initialEmpathizeCount={empathizeCount}
        />
      </div>

      <div className="mt-6">
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
          {comments?.map((comment, index) => (
            <article
              key={comment.id}
              className="rounded-[22px] bg-[var(--ub-surface-card-strong)] p-4 shadow-[var(--ub-shadow-soft)]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ub-text-primary)]">
                    익명 {index + 1}
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
