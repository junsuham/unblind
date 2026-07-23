import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminIcon } from '../components/AdminIcon'
import {
  AdminHeader,
  AdminListGroup,
  AdminListRow,
  AdminNotice,
  AdminPageShell,
} from '../components/AdminIOS'

export const dynamic = 'force-dynamic'

type AdminSearchPageProps = {
  searchParams: Promise<{
    q?: string | string[]
  }>
}

type AllowedUserSearchRow = {
  email: string
  status: string
  memo: string | null
  last_seen_at: string | null
}

type ProfileSearchRow = {
  email: string
  nickname: string
  church_name: string
  occupation: string
}

type PostSearchRow = {
  id: string
  board: string
  title: string
  content: string
  status: string
  created_at: string
}

type CommentSearchRow = {
  id: string
  post_id: string
  content: string
  status: string
  created_at: string
}

type PostTitleRow = {
  id: string
  title: string
}

type UserSearchResult = {
  email: string
  status: string
  memo: string | null
  lastSeenAt: string | null
  nickname: string | null
  churchName: string | null
  occupation: string | null
}

const boardLabels: Record<string, string> = {
  prayer: '기도 요청',
  faith: '신앙',
  daily: '일상',
  church: '교회생활',
  work: '진로/직장',
  relationship: '연애/결혼',
}

const statusLabels: Record<string, string> = {
  active: '승인됨',
  blocked: '차단됨',
  pending: '승인 대기',
  visible: '노출 중',
  hidden: '숨김',
  deleted: '삭제됨',
}

function getStatusClass(status: string) {
  if (status === 'active' || status === 'visible') {
    return 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]'
  }

  if (status === 'pending' || status === 'hidden') {
    return 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]'
  }

  return 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]'
}

function cleanSearchQuery(value: string) {
  return value
    .replace(/[,%_()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

function mergeUniqueRows<T extends { id: string }>(groups: T[][]) {
  const rowsById = new Map<string, T>()

  groups.flat().forEach((row) => {
    rowsById.set(row.id, row)
  })

  return Array.from(rowsById.values())
}

function formatDate(value: string | null) {
  if (!value) {
    return '활동 기록 없음'
  }

  return new Date(value).toLocaleString('ko-KR')
}

export default async function AdminSearchPage({
  searchParams,
}: AdminSearchPageProps) {
  await requireAdmin()

  const params = await searchParams
  const rawQuery = Array.isArray(params.q) ? params.q[0] ?? '' : params.q ?? ''
  const query = cleanSearchQuery(rawQuery)
  const shouldSearch = query.length >= 2

  let users: UserSearchResult[] = []
  let posts: PostSearchRow[] = []
  let comments: CommentSearchRow[] = []
  let postsById = new Map<string, PostTitleRow>()
  let errorMessages: string[] = []

  if (shouldSearch) {
    const pattern = `%${query}%`

    const [
      allowedEmailResult,
      allowedMemoResult,
      profileEmailResult,
      profileNicknameResult,
      profileChurchResult,
      postTitleResult,
      postContentResult,
      commentResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('allowed_users')
        .select('email, status, memo, last_seen_at')
        .ilike('email', pattern)
        .limit(20)
        .returns<AllowedUserSearchRow[]>(),
      supabaseAdmin
        .from('allowed_users')
        .select('email, status, memo, last_seen_at')
        .ilike('memo', pattern)
        .limit(20)
        .returns<AllowedUserSearchRow[]>(),
      supabaseAdmin
        .from('user_profiles')
        .select('email, nickname, church_name, occupation')
        .ilike('email', pattern)
        .limit(20)
        .returns<ProfileSearchRow[]>(),
      supabaseAdmin
        .from('user_profiles')
        .select('email, nickname, church_name, occupation')
        .ilike('nickname', pattern)
        .limit(20)
        .returns<ProfileSearchRow[]>(),
      supabaseAdmin
        .from('user_profiles')
        .select('email, nickname, church_name, occupation')
        .ilike('church_name', pattern)
        .limit(20)
        .returns<ProfileSearchRow[]>(),
      supabaseAdmin
        .from('posts')
        .select('id, board, title, content, status, created_at')
        .ilike('title', pattern)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<PostSearchRow[]>(),
      supabaseAdmin
        .from('posts')
        .select('id, board, title, content, status, created_at')
        .ilike('content', pattern)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<PostSearchRow[]>(),
      supabaseAdmin
        .from('comments')
        .select('id, post_id, content, status, created_at')
        .ilike('content', pattern)
        .order('created_at', { ascending: false })
        .limit(30)
        .returns<CommentSearchRow[]>(),
    ])

    const allowedRows = [
      ...(allowedEmailResult.data ?? []),
      ...(allowedMemoResult.data ?? []),
    ]
    const profileRows = [
      ...(profileEmailResult.data ?? []),
      ...(profileNicknameResult.data ?? []),
      ...(profileChurchResult.data ?? []),
    ]
    const usersByEmail = new Map<string, UserSearchResult>()

    allowedRows.forEach((row) => {
      usersByEmail.set(row.email.toLowerCase(), {
        email: row.email,
        status: row.status,
        memo: row.memo,
        lastSeenAt: row.last_seen_at,
        nickname: null,
        churchName: null,
        occupation: null,
      })
    })

    profileRows.forEach((row) => {
      const emailKey = row.email.toLowerCase()
      const existing = usersByEmail.get(emailKey)

      usersByEmail.set(emailKey, {
        email: row.email,
        status: existing?.status ?? 'pending',
        memo: existing?.memo ?? null,
        lastSeenAt: existing?.lastSeenAt ?? null,
        nickname: row.nickname,
        churchName: row.church_name,
        occupation: row.occupation,
      })
    })

    users = Array.from(usersByEmail.values()).slice(0, 30)
    posts = mergeUniqueRows([
      postTitleResult.data ?? [],
      postContentResult.data ?? [],
    ])
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
      .slice(0, 30)
    comments = commentResult.data ?? []

    const commentPostIds = [...new Set(comments.map((comment) => comment.post_id))]

    if (commentPostIds.length > 0) {
      const { data: postTitles, error: postTitleError } = await supabaseAdmin
        .from('posts')
        .select('id, title')
        .in('id', commentPostIds)
        .returns<PostTitleRow[]>()

      postsById = new Map((postTitles ?? []).map((post) => [post.id, post]))

      if (postTitleError) {
        errorMessages.push(postTitleError.message)
      }
    }

    errorMessages = [
      ...errorMessages,
      allowedEmailResult.error?.message,
      allowedMemoResult.error?.message,
      profileEmailResult.error?.message,
      profileNicknameResult.error?.message,
      profileChurchResult.error?.message,
      postTitleResult.error?.message,
      postContentResult.error?.message,
      commentResult.error?.message,
    ].filter((message): message is string => Boolean(message))
  }

  const totalResultCount = users.length + posts.length + comments.length

  return (
    <AdminPageShell>
      <AdminHeader
        title="통합 검색"
        description="이메일, 앱 아이디, 교회, 게시글과 댓글 내용을 한 번에 찾습니다."
      />

      <form action="/admin/search" className="mb-7" role="search">
        <label htmlFor="admin-search" className="sr-only">
          관리자 통합 검색어
        </label>
        <div className="admin-ios-card flex min-h-[54px] items-center gap-3 rounded-[16px] px-4">
          <AdminIcon
            name="search"
            className="h-5 w-5 shrink-0 text-[var(--admin-text-tertiary)]"
          />
          <input
            id="admin-search"
            name="q"
            type="search"
            defaultValue={query}
            autoFocus
            enterKeyHint="search"
            placeholder="두 글자 이상 입력"
            className="min-w-0 flex-1 bg-transparent text-[17px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-tertiary)]"
          />
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[var(--admin-accent-soft)] px-3 text-[14px] font-semibold text-[var(--admin-accent)] active:opacity-70"
          >
            검색
          </button>
        </div>
      </form>

      {query.length > 0 && query.length < 2 && (
        <AdminNotice title="검색어가 너무 짧습니다" tone="warning">
          두 글자 이상 입력해주세요.
        </AdminNotice>
      )}

      {errorMessages.length > 0 && (
        <div className="mb-6">
          <AdminNotice title="일부 결과를 불러오지 못했습니다" tone="danger">
            잠시 후 다시 검색해주세요.
          </AdminNotice>
        </div>
      )}

      {shouldSearch && (
        <p className="mb-4 px-4 ios-caption text-[var(--admin-text-secondary)]">
          ‘{query}’ 검색 결과 {totalResultCount}건
        </p>
      )}

      {users.length > 0 && (
        <AdminListGroup title={`사용자 ${users.length}`}>
          {users.map((user) => (
            <AdminListRow
              key={user.email}
              href="/admin/users"
              title={user.nickname || user.email}
              subtitle={`${user.email}${user.churchName ? ` · ${user.churchName}` : ''} · 최근 활동 ${formatDate(user.lastSeenAt)}`}
              leading={<AdminIcon name="users" className="h-6 w-6" />}
              trailing={
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${getStatusClass(user.status)}`}
                >
                  {statusLabels[user.status] ?? user.status}
                </span>
              }
            >
              {(user.memo || user.occupation) && (
                <p className="rounded-[14px] bg-[var(--admin-card-secondary)] p-3 ios-caption text-[var(--admin-text-secondary)]">
                  {[user.occupation, user.memo].filter(Boolean).join(' · ')}
                </p>
              )}
            </AdminListRow>
          ))}
        </AdminListGroup>
      )}

      {posts.length > 0 && (
        <AdminListGroup title={`게시글 ${posts.length}`}>
          {posts.map((post) => (
            <AdminListRow
              key={post.id}
              href={`/admin/posts#post-${post.id}`}
              title={post.title}
              subtitle={`${boardLabels[post.board] ?? post.board} · ${new Date(post.created_at).toLocaleDateString('ko-KR')}`}
              leading={<AdminIcon name="post" className="h-6 w-6" />}
              trailing={
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${getStatusClass(post.status)}`}
                >
                  {statusLabels[post.status] ?? post.status}
                </span>
              }
            >
              <p className="line-clamp-2 ios-secondary text-[var(--admin-text-secondary)]">
                {post.content}
              </p>
            </AdminListRow>
          ))}
        </AdminListGroup>
      )}

      {comments.length > 0 && (
        <AdminListGroup title={`댓글 ${comments.length}`}>
          {comments.map((comment) => (
            <AdminListRow
              key={comment.id}
              href={`/admin/comments?postId=${comment.post_id}#comment-${comment.id}`}
              title={comment.content}
              subtitle={`원글: ${postsById.get(comment.post_id)?.title ?? '확인 불가'} · ${new Date(comment.created_at).toLocaleDateString('ko-KR')}`}
              leading={<AdminIcon name="comment" className="h-6 w-6" />}
              trailing={
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${getStatusClass(comment.status)}`}
                >
                  {statusLabels[comment.status] ?? comment.status}
                </span>
              }
            />
          ))}
        </AdminListGroup>
      )}

      {shouldSearch && totalResultCount === 0 && errorMessages.length === 0 && (
        <AdminNotice title="검색 결과가 없습니다">
          다른 이메일, 앱 아이디, 교회명 또는 내용으로 다시 검색해보세요.
        </AdminNotice>
      )}

      {!shouldSearch && query.length === 0 && (
        <AdminListGroup title="검색할 수 있는 항목">
          <AdminListRow
            title="사용자"
            subtitle="이메일, 앱 아이디, 교회명, 운영 메모"
            leading={<AdminIcon name="users" className="h-6 w-6" />}
          />
          <AdminListRow
            title="콘텐츠"
            subtitle="게시글 제목과 본문, 댓글 내용"
            leading={<AdminIcon name="post" className="h-6 w-6" />}
          />
        </AdminListGroup>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center px-4 text-[15px] font-semibold text-[var(--admin-accent)] active:opacity-70"
        >
          관리자 홈으로
        </Link>
      </div>
    </AdminPageShell>
  )
}
