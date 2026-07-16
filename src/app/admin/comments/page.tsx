import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminContentActionButtons from '../components/AdminContentActionButtons'
import {
  AdminHeader,
  AdminNotice,
  AdminPageShell,
} from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

type AdminCommentsPageProps = {
  searchParams: Promise<{
    postId?: string
  }>
}

type CommentRow = {
  id: string
  post_id: string
  content: string
  status: string
  created_at: string
}

type CommentAuthorLink = {
  comment_id: string
  user_email: string
}

type PostRow = {
  id: string
  board: string
  title: string
  status: string
}

const boardNames: Record<string, string> = {
  prayer: '기도요청',
  faith: '신앙',
  daily: '일상',
  church: '교회생활',
  work: '진로/직장',
  relationship: '연애/결혼',
}

const statusLabels: Record<string, string> = {
  visible: '노출 중',
  hidden: '숨김',
  deleted: '삭제됨',
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR')
}

function getStatusClass(status: string) {
  if (status === 'visible') {
    return 'rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700'
  }

  if (status === 'hidden') {
    return 'rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700'
  }

  return 'rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700'
}

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  await requireAdmin()

  const params = await searchParams
  const postId = params.postId

  let query = supabaseAdmin
    .from('comments')
    .select('id, post_id, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (postId) {
    query = query.eq('post_id', postId)
  }

  const { data, error } = await query.returns<CommentRow[]>()

  const comments = data ?? []
  const commentIds = comments.map((comment) => comment.id)
  const postIds = [...new Set(comments.map((comment) => comment.post_id))]

  const authorsByCommentId = new Map<string, string>()
  const postsById = new Map<string, PostRow>()

  if (commentIds.length > 0) {
    const { data: authorLinks } = await supabaseAdmin
      .from('comment_author_links')
      .select('comment_id, user_email')
      .in('comment_id', commentIds)
      .returns<CommentAuthorLink[]>()

    authorLinks?.forEach((link) => {
      authorsByCommentId.set(link.comment_id, link.user_email)
    })
  }

  if (postIds.length > 0) {
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('id, board, title, status')
      .in('id', postIds)
      .returns<PostRow[]>()

    posts?.forEach((post) => {
      postsById.set(post.id, post)
    })
  }

  const visibleCount = comments.filter(
    (comment) => comment.status === 'visible'
  ).length

  const hiddenCount = comments.filter(
    (comment) => comment.status === 'hidden'
  ).length

  const deletedCount = comments.filter(
    (comment) => comment.status === 'deleted'
  ).length

  return (
    <AdminPageShell>
        <AdminHeader
          title="댓글 관리"
          description="최근 댓글 100개를 확인하고 숨김, 삭제, 복구 처리합니다."
        />

        <div className="mb-5">

          {postId && (
            <Link
              href="/admin/comments"
              className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[var(--admin-accent)]"
            >
              전체 댓글 보기로 돌아가기
            </Link>
          )}
        </div>

        <div className="mb-5">
          <AdminNotice title="운영자 주의" tone="warning">
            댓글 작성자 이메일은 운영 목적에 한해서만 확인하세요.
            사용자 화면에는 계속 익명으로 표시됩니다.
          </AdminNotice>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/70 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-[#8E8E93]">노출</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {visibleCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-[#8E8E93]">숨김</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {hiddenCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-[#8E8E93]">삭제</p>
            <p className="mt-1 text-2xl font-bold text-black">
              {deletedCount}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            댓글을 불러오지 못했습니다: {error.message}
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => {
            const authorEmail =
              authorsByCommentId.get(comment.id) ?? '기존 데이터라 확인 안 됨'

            const post = postsById.get(comment.post_id)
            const boardName = post ? boardNames[post.board] ?? post.board : '-'

            return (
              <article
                id={`comment-${comment.id}`}
                key={comment.id}
                className="scroll-mt-24 rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-stone-400">
                      댓글 · {formatDate(comment.created_at)}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      <span className="font-medium text-black">
                        작성자:
                      </span>{' '}
                      {authorEmail}
                    </p>
                  </div>

                  <span className={getStatusClass(comment.status)}>
                    {statusLabels[comment.status] ?? comment.status}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fff7f2] p-4 text-sm leading-6 text-stone-600">
                  <p>
                    <span className="font-medium text-black">
                      원글:
                    </span>{' '}
                    {post?.title ?? '원글 확인 불가'}
                  </p>

                  <p>
                    <span className="font-medium text-black">
                      게시판:
                    </span>{' '}
                    {boardName}
                  </p>

                  <p>
                    <span className="font-medium text-black">
                      원글 상태:
                    </span>{' '}
                    {post ? statusLabels[post.status] ?? post.status : '-'}
                  </p>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {comment.content}
                </p>

                <div className="mt-4 flex gap-3">
                  {post && post.status === 'visible' && (
                    <Link
                      href={`/post/${post.id}`}
                      className="text-xs font-medium text-[#8E8E93] underline underline-offset-4"
                    >
                      원글 보기
                    </Link>
                  )}

                  {post && (
                    <Link
                      href={`/admin/posts`}
                      className="text-xs font-medium text-[#8E8E93] underline underline-offset-4"
                    >
                      게시글 관리로
                    </Link>
                  )}
                </div>

                <AdminContentActionButtons
                  targetType="comment"
                  targetId={comment.id}
                  targetStatus={comment.status}
                />
              </article>
            )
          })}

          {comments.length === 0 && !error && (
            <div className="rounded-2xl border border-white/70 bg-white p-5 text-sm text-stone-600">
              아직 댓글이 없습니다.
            </div>
          )}
        </div>
    </AdminPageShell>
  )
}
