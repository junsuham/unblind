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

type PostRow = {
  id: string
  board: string
  title: string
  content: string
  status: string
  created_at: string
}

type PostAuthorLink = {
  post_id: string
  user_email: string
}

type CommentRow = {
  post_id: string
  status: string
}

type ReactionRow = {
  post_id: string
  type: 'pray' | 'empathize'
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

export default async function AdminPostsPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, board, title, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<PostRow[]>()

  const posts = data ?? []
  const postIds = posts.map((post) => post.id)

  const authorsByPostId = new Map<string, string>()
  const commentCountsByPostId = new Map<string, number>()
  const prayCountsByPostId = new Map<string, number>()
  const empathizeCountsByPostId = new Map<string, number>()

  if (postIds.length > 0) {
    const { data: authorLinks } = await supabaseAdmin
      .from('post_author_links')
      .select('post_id, user_email')
      .in('post_id', postIds)
      .returns<PostAuthorLink[]>()

    authorLinks?.forEach((link) => {
      authorsByPostId.set(link.post_id, link.user_email)
    })

    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('post_id, status')
      .in('post_id', postIds)
      .returns<CommentRow[]>()

    comments?.forEach((comment) => {
      if (comment.status === 'visible') {
        commentCountsByPostId.set(
          comment.post_id,
          (commentCountsByPostId.get(comment.post_id) ?? 0) + 1
        )
      }
    })

    const { data: reactions } = await supabaseAdmin
      .from('reactions')
      .select('post_id, type')
      .in('post_id', postIds)
      .returns<ReactionRow[]>()

    reactions?.forEach((reaction) => {
      if (reaction.type === 'pray') {
        prayCountsByPostId.set(
          reaction.post_id,
          (prayCountsByPostId.get(reaction.post_id) ?? 0) + 1
        )
      }

      if (reaction.type === 'empathize') {
        empathizeCountsByPostId.set(
          reaction.post_id,
          (empathizeCountsByPostId.get(reaction.post_id) ?? 0) + 1
        )
      }
    })
  }

  const visibleCount = posts.filter((post) => post.status === 'visible').length
  const hiddenCount = posts.filter((post) => post.status === 'hidden').length
  const deletedCount = posts.filter((post) => post.status === 'deleted').length

  return (
    <AdminPageShell>
        <AdminHeader
          backHref="/admin"
          title="게시글 관리"
          description="최근 게시글 100개를 확인하고 숨김, 삭제, 복구 처리합니다."
        />

        <div className="mb-5">
          <AdminNotice title="운영자 주의" tone="warning">
            작성자 이메일은 신고 대응과 안전 운영 목적에 한해 확인하세요.
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
            게시글을 불러오지 못했습니다: {error.message}
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => {
            const authorEmail =
              authorsByPostId.get(post.id) ?? '기존 데이터라 확인 안 됨'

            const boardName = boardNames[post.board] ?? post.board

            const commentCount = commentCountsByPostId.get(post.id) ?? 0
            const prayCount = prayCountsByPostId.get(post.id) ?? 0
            const empathizeCount = empathizeCountsByPostId.get(post.id) ?? 0

            return (
              <article
                id={`post-${post.id}`}
                key={post.id}
                className="scroll-mt-24 rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-stone-400">
                      {boardName} · {formatDate(post.created_at)}
                    </p>

                    <h2 className="mt-2 font-bold leading-6 text-black">
                      {post.title}
                    </h2>
                  </div>

                  <span className={getStatusClass(post.status)}>
                    {statusLabels[post.status] ?? post.status}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#fff7f2] p-4 text-sm leading-6 text-stone-600">
                  <p>
                    <span className="font-medium text-black">
                      작성자:
                    </span>{' '}
                    {authorEmail}
                  </p>

                  <p>
                    <span className="font-medium text-black">
                      댓글:
                    </span>{' '}
                    {commentCount}개
                  </p>

                  <p>
                    <span className="font-medium text-black">
                      반응:
                    </span>{' '}
                    기도 {prayCount} · 공감 {empathizeCount}
                  </p>
                </div>

                <p className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {post.content}
                </p>

                <div className="mt-4 flex gap-3">
                  {post.status === 'visible' && (
                    <Link
                      href={`/post/${post.id}`}
                      className="text-xs font-medium text-[#8E8E93] underline underline-offset-4"
                    >
                      사용자 화면에서 보기
                    </Link>
                  )}

                  <Link
                    href={`/admin/comments?postId=${post.id}`}
                    className="text-xs font-medium text-[#8E8E93] underline underline-offset-4"
                  >
                    이 글의 댓글 보기
                  </Link>
                </div>

                <AdminContentActionButtons
                  targetType="post"
                  targetId={post.id}
                  targetStatus={post.status}
                />
              </article>
            )
          })}

          {posts.length === 0 && !error && (
            <div className="rounded-2xl border border-white/70 bg-white p-5 text-sm text-stone-600">
              아직 게시글이 없습니다.
            </div>
          )}
        </div>
    </AdminPageShell>
  )
}
