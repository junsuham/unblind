import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import AdminModerationButtons from './AdminModerationButtons'
import {
  AdminHeader,
  AdminNotice,
  AdminPageShell,
} from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

type ReportReason =
  | 'personal_info'
  | 'attack'
  | 'sexual'
  | 'cult'
  | 'money'
  | 'self_harm'
  | 'spam'
  | 'other'

type ReportRow = {
  id: string
  target_type: 'post' | 'comment'
  target_id: string
  reporter_actor_key: string
  reporter_user_id: string | null
  reporter_email: string | null
  reason: ReportReason
  detail: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
}

type PostTarget = {
  id: string
  board: string
  title: string
  content: string
  status: string
}

type CommentTarget = {
  id: string
  post_id: string
  content: string
  status: string
}

type PostAuthorLink = {
  post_id: string
  user_id: string
  user_email: string
}

type CommentAuthorLink = {
  comment_id: string
  user_id: string
  user_email: string
}

const reasonLabels: Record<ReportReason, string> = {
  personal_info: '개인을 특정할 수 있어요',
  attack: '누군가를 공격하거나 비난해요',
  sexual: '성적 불쾌감을 줘요',
  cult: '이단/사이비 포교 같아요',
  money: '금전 요구가 있어요',
  self_harm: '자해/위험 내용이 있어요',
  spam: '스팸이에요',
  other: '기타',
}

const statusLabels: Record<string, string> = {
  pending: '미처리',
  reviewed: '처리됨',
  dismissed: '문제 없음',
  visible: '노출 중',
  hidden: '숨김',
  deleted: '삭제됨',
}

function formatSensitiveEmail(value: string | null | undefined) {
  return value || '기존 데이터라 확인 안 됨'
}

export default async function AdminReportsPage() {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select(
      'id, target_type, target_id, reporter_actor_key, reporter_user_id, reporter_email, reason, detail, status, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<ReportRow[]>()

  const reports = data ?? []

  const postIds = [
    ...new Set(
      reports
        .filter((report) => report.target_type === 'post')
        .map((report) => report.target_id)
    ),
  ]

  const commentIds = [
    ...new Set(
      reports
        .filter((report) => report.target_type === 'comment')
        .map((report) => report.target_id)
    ),
  ]

  const postsById = new Map<string, PostTarget>()
  const commentsById = new Map<string, CommentTarget>()
  const postAuthorsById = new Map<string, PostAuthorLink>()
  const commentAuthorsById = new Map<string, CommentAuthorLink>()

  if (postIds.length > 0) {
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('id, board, title, content, status')
      .in('id', postIds)
      .returns<PostTarget[]>()

    posts?.forEach((post) => {
      postsById.set(post.id, post)
    })

    const { data: postAuthorLinks } = await supabaseAdmin
      .from('post_author_links')
      .select('post_id, user_id, user_email')
      .in('post_id', postIds)
      .returns<PostAuthorLink[]>()

    postAuthorLinks?.forEach((link) => {
      postAuthorsById.set(link.post_id, link)
    })
  }

  if (commentIds.length > 0) {
    const { data: comments } = await supabaseAdmin
      .from('comments')
      .select('id, post_id, content, status')
      .in('id', commentIds)
      .returns<CommentTarget[]>()

    comments?.forEach((comment) => {
      commentsById.set(comment.id, comment)
    })

    const { data: commentAuthorLinks } = await supabaseAdmin
      .from('comment_author_links')
      .select('comment_id, user_id, user_email')
      .in('comment_id', commentIds)
      .returns<CommentAuthorLink[]>()

    commentAuthorLinks?.forEach((link) => {
      commentAuthorsById.set(link.comment_id, link)
    })
  }

  return (
    <AdminPageShell>
        <AdminHeader
          backHref="/admin"
          title="신고 관리"
          description="최근 신고 100건을 확인하고 글과 댓글을 조치합니다."
        />

        <div className="mb-5">
          <AdminNotice title="운영자 주의" tone="warning">
            작성자와 신고자 정보는 신고 처리와 안전 운영 목적으로만 확인하세요.
            외부 공유나 불필요한 열람은 피해야 합니다.
          </AdminNotice>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            신고 목록을 불러오지 못했습니다: {error.message}
          </div>
        )}

        <div className="space-y-4">
          {reports.map((report) => {
            const postTarget =
              report.target_type === 'post'
                ? postsById.get(report.target_id)
                : null

            const commentTarget =
              report.target_type === 'comment'
                ? commentsById.get(report.target_id)
                : null

            const postAuthor =
              postTarget ? postAuthorsById.get(postTarget.id) : null

            const commentAuthor =
              commentTarget ? commentAuthorsById.get(commentTarget.id) : null

            const targetStatus =
              postTarget?.status ?? commentTarget?.status ?? 'unknown'

            return (
              <article
                key={report.id}
                className="rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-stone-400">
                      {report.target_type === 'post' ? '게시글 신고' : '댓글 신고'}
                    </p>

                    <h2 className="mt-1 font-bold text-black">
                      {reasonLabels[report.reason]}
                    </h2>
                  </div>

                  <span className="rounded-full bg-[#ffe2d2] px-3 py-1 text-xs font-medium text-stone-600">
                    {statusLabels[report.status] ?? report.status}
                  </span>
                </div>

                <div className="mb-4 rounded-2xl border border-white/70 p-4 text-sm leading-6 text-stone-600">
                  <p>
                    <span className="font-medium text-black">
                      신고자:
                    </span>{' '}
                    {formatSensitiveEmail(report.reporter_email)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#fff7f2] p-4">
                  {postTarget && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-stone-400">
                        대상 글 · {statusLabels[postTarget.status] ?? postTarget.status}
                      </p>

                      <p className="mb-2 text-sm text-stone-600">
                        <span className="font-medium text-black">
                          작성자:
                        </span>{' '}
                        {formatSensitiveEmail(postAuthor?.user_email)}
                      </p>

                      <p className="font-semibold text-black">
                        {postTarget.title}
                      </p>

                      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                        {postTarget.content}
                      </p>

                      <Link
                        href={`/post/${postTarget.id}`}
                        className="mt-3 inline-block text-xs font-medium text-[#8E8E93] underline underline-offset-4"
                      >
                        원글 보기
                      </Link>
                    </div>
                  )}

                  {commentTarget && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-stone-400">
                        대상 댓글 · {statusLabels[commentTarget.status] ?? commentTarget.status}
                      </p>

                      <p className="mb-2 text-sm text-stone-600">
                        <span className="font-medium text-black">
                          작성자:
                        </span>{' '}
                        {formatSensitiveEmail(commentAuthor?.user_email)}
                      </p>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {commentTarget.content}
                      </p>

                      <Link
                        href={`/post/${commentTarget.post_id}`}
                        className="mt-3 inline-block text-xs font-medium text-[#8E8E93] underline underline-offset-4"
                      >
                        원글 보기
                      </Link>
                    </div>
                  )}

                  {!postTarget && !commentTarget && (
                    <p className="text-sm text-[#8E8E93]">
                      신고 대상이 없거나 이미 삭제되었습니다.
                    </p>
                  )}
                </div>

                {report.detail && (
                  <div className="mt-4 rounded-2xl border border-white/70 p-4">
                    <p className="mb-1 text-xs font-medium text-stone-400">
                      신고자 추가 설명
                    </p>

                    <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
                      {report.detail}
                    </p>
                  </div>
                )}

                <p className="mt-4 text-xs text-stone-400">
                  신고 시각: {new Date(report.created_at).toLocaleString('ko-KR')}
                </p>

                <AdminModerationButtons
                  targetType={report.target_type}
                  targetId={report.target_id}
                  reportId={report.id}
                  targetStatus={targetStatus}
                />
              </article>
            )
          })}

          {reports.length === 0 && !error && (
            <div className="rounded-2xl border border-white/70 bg-white p-5 text-sm text-stone-600">
              아직 신고가 없습니다.
            </div>
          )}
        </div>
    </AdminPageShell>
  )
}
