import Link from 'next/link'
import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

type AllowedUserCreatedRow = {
  created_at: string
  status: string
}

type AllowedUserAgreedRow = {
  agreed_at: string | null
}

type PostRow = {
  id: string
  board: string
  status: string
  created_at: string
}

type CommentRow = {
  id: string
  status: string
  created_at: string
}

type ReactionRow = {
  id: string
  type: 'pray' | 'empathize'
  created_at: string
}

type ReportRow = {
  id: string
  status: string
  reason: string
  created_at: string
}

const boardNames: Record<string, string> = {
  prayer: '기도요청',
  faith: '신앙고민',
  church: '교회생활',
  work: '진로/직장',
  relationship: '연애/결혼',
}

const reportReasonLabels: Record<string, string> = {
  personal_info: '개인정보/특정 가능',
  attack: '공격/비난',
  sexual: '성적 불쾌감',
  cult: '이단/사이비 포교',
  money: '금전 요구',
  self_harm: '자해/위험',
  spam: '스팸',
  other: '기타',
}

function getKoreaDateKey(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function getDisplayDate(key: string) {
  return key.slice(5).replace('-', '/')
}

function getLastDayKeys(dayCount: number) {
  const result: string[] = []
  const now = new Date()

  for (let index = dayCount - 1; index >= 0; index -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - index)
    result.push(getKoreaDateKey(date))
  }

  return result
}

function addCount(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount)
}

function getPercent(value: number, max: number) {
  if (max <= 0 || value <= 0) {
    return 0
  }

  return Math.max(8, Math.round((value / max) * 100))
}

function getErrorMessages(results: { error: { message: string } | null }[]) {
  return results
    .map((result) => result.error?.message)
    .filter((message): message is string => Boolean(message))
}

export default async function AdminAnalyticsPage() {
  await requireAdmin()

  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - 13)
  startDate.setHours(0, 0, 0, 0)

  const startIso = startDate.toISOString()
  const dayKeys = getLastDayKeys(14)

  const [
    activeUsersCountResult,
    agreedUsersCountResult,
    pendingReportsCountResult,
    visiblePostsCountResult,
    visibleCommentsCountResult,
    usersCreatedResult,
    usersAgreedResult,
    postsResult,
    commentsResult,
    reactionsResult,
    reportsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('allowed_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabaseAdmin
      .from('allowed_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('agreed_at', 'is', null),

    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),

    supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visible'),

    supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visible'),

    supabaseAdmin
      .from('allowed_users')
      .select('created_at, status')
      .gte('created_at', startIso)
      .returns<AllowedUserCreatedRow[]>(),

    supabaseAdmin
      .from('allowed_users')
      .select('agreed_at')
      .not('agreed_at', 'is', null)
      .gte('agreed_at', startIso)
      .returns<AllowedUserAgreedRow[]>(),

    supabaseAdmin
      .from('posts')
      .select('id, board, status, created_at')
      .gte('created_at', startIso)
      .returns<PostRow[]>(),

    supabaseAdmin
      .from('comments')
      .select('id, status, created_at')
      .gte('created_at', startIso)
      .returns<CommentRow[]>(),

    supabaseAdmin
      .from('reactions')
      .select('id, type, created_at')
      .gte('created_at', startIso)
      .returns<ReactionRow[]>(),

    supabaseAdmin
      .from('reports')
      .select('id, status, reason, created_at')
      .gte('created_at', startIso)
      .returns<ReportRow[]>(),
  ])

  const usersCreated = usersCreatedResult.data ?? []
  const usersAgreed = usersAgreedResult.data ?? []
  const posts = postsResult.data ?? []
  const comments = commentsResult.data ?? []
  const reactions = reactionsResult.data ?? []
  const reports = reportsResult.data ?? []

  const userCreatedByDay = new Map<string, number>()
  const userAgreedByDay = new Map<string, number>()
  const postsByDay = new Map<string, number>()
  const commentsByDay = new Map<string, number>()
  const reactionsByDay = new Map<string, number>()
  const reportsByDay = new Map<string, number>()

  const postsByBoard = new Map<string, number>()
  const reportsByReason = new Map<string, number>()
  const reactionsByType = new Map<string, number>()

  usersCreated.forEach((row) => {
    addCount(userCreatedByDay, getKoreaDateKey(row.created_at))
  })

  usersAgreed.forEach((row) => {
    if (row.agreed_at) {
      addCount(userAgreedByDay, getKoreaDateKey(row.agreed_at))
    }
  })

  posts.forEach((post) => {
    addCount(postsByDay, getKoreaDateKey(post.created_at))
    addCount(postsByBoard, post.board)
  })

  comments.forEach((comment) => {
    addCount(commentsByDay, getKoreaDateKey(comment.created_at))
  })

  reactions.forEach((reaction) => {
    addCount(reactionsByDay, getKoreaDateKey(reaction.created_at))
    addCount(reactionsByType, reaction.type)
  })

  reports.forEach((report) => {
    addCount(reportsByDay, getKoreaDateKey(report.created_at))
    addCount(reportsByReason, report.reason)
  })

  const dailyRows = dayKeys.map((key) => ({
    key,
    label: getDisplayDate(key),
    users: userCreatedByDay.get(key) ?? 0,
    agreements: userAgreedByDay.get(key) ?? 0,
    posts: postsByDay.get(key) ?? 0,
    comments: commentsByDay.get(key) ?? 0,
    reactions: reactionsByDay.get(key) ?? 0,
    reports: reportsByDay.get(key) ?? 0,
  }))

  const maxDailyActivity = Math.max(
    1,
    ...dailyRows.map(
      (row) => row.posts + row.comments + row.reactions + row.reports
    )
  )

  const boardRows = Array.from(postsByBoard.entries())
    .map(([board, count]) => ({
      board,
      label: boardNames[board] ?? board,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const maxBoardCount = Math.max(1, ...boardRows.map((row) => row.count))

  const reportReasonRows = Array.from(reportsByReason.entries())
    .map(([reason, count]) => ({
      reason,
      label: reportReasonLabels[reason] ?? reason,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const maxReportReasonCount = Math.max(
    1,
    ...reportReasonRows.map((row) => row.count)
  )

  const prayCount = reactionsByType.get('pray') ?? 0
  const empathizeCount = reactionsByType.get('empathize') ?? 0

  const summaryCards = [
    {
      label: '활성 승인 사용자',
      value: activeUsersCountResult.count ?? 0,
    },
    {
      label: '약속 동의 완료',
      value: agreedUsersCountResult.count ?? 0,
    },
    {
      label: '미처리 신고',
      value: pendingReportsCountResult.count ?? 0,
    },
    {
      label: '노출 중인 글',
      value: visiblePostsCountResult.count ?? 0,
    },
    {
      label: '노출 중인 댓글',
      value: visibleCommentsCountResult.count ?? 0,
    },
    {
      label: '최근 14일 글',
      value: posts.length,
    },
    {
      label: '최근 14일 댓글',
      value: comments.length,
    },
    {
      label: '최근 14일 신고',
      value: reports.length,
    },
  ]

  const errors = getErrorMessages([
    activeUsersCountResult,
    agreedUsersCountResult,
    pendingReportsCountResult,
    visiblePostsCountResult,
    visibleCommentsCountResult,
    usersCreatedResult,
    usersAgreedResult,
    postsResult,
    commentsResult,
    reactionsResult,
    reportsResult,
  ])

  return (
    <main className="min-h-screen bg-[#ff4b00] px-5 py-8">
      <section className="mx-auto max-w-md">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-[#8E8E93]">
            ← 관리자 홈으로
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-black">
            베타 운영 통계
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            최근 14일 기준으로 참여, 글, 댓글, 반응, 신고 흐름을 확인합니다.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            <p className="font-semibold">일부 통계를 불러오지 못했습니다.</p>

            <ul className="mt-2 list-inside list-disc">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl"
            >
              <p className="text-sm text-[#8E8E93]">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-black">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl">
          <h2 className="text-lg font-bold text-black">
            최근 14일 일별 활동
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            막대는 글, 댓글, 반응, 신고를 합산한 활동량입니다.
          </p>

          <div className="mt-5 space-y-4">
            {dailyRows.map((row) => {
              const activityTotal =
                row.posts + row.comments + row.reactions + row.reports

              return (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#8E8E93]">
                    <span>{row.label}</span>
                    <span>
                      글 {row.posts} · 댓글 {row.comments} · 반응 {row.reactions} · 신고 {row.reports}
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-[#ffe2d2]">
                    <div
                      className="h-3 rounded-full bg-[#ff4b00]"
                      style={{
                        width: `${getPercent(activityTotal, maxDailyActivity)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-stone-400">
                    승인 {row.users} · 동의 {row.agreements}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl">
          <h2 className="text-lg font-bold text-black">
            게시판별 글 수
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            최근 14일 동안 어느 게시판에 글이 많이 올라왔는지 확인합니다.
          </p>

          <div className="mt-5 space-y-4">
            {boardRows.map((row) => (
              <div key={row.board}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700">
                    {row.label}
                  </span>
                  <span className="text-[#8E8E93]">{row.count}</span>
                </div>

                <div className="h-3 rounded-full bg-[#ffe2d2]">
                  <div
                    className="h-3 rounded-full bg-[#ff4b00]"
                    style={{
                      width: `${getPercent(row.count, maxBoardCount)}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {boardRows.length === 0 && (
              <p className="text-sm text-[#8E8E93]">
                최근 14일 동안 작성된 글이 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl">
          <h2 className="text-lg font-bold text-black">
            반응 요약
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#fff7f2] p-4">
              <p className="text-sm text-[#8E8E93]">기도할게요</p>
              <p className="mt-2 text-2xl font-bold text-black">
                {prayCount}
              </p>
            </div>

            <div className="rounded-2xl bg-[#fff7f2] p-4">
              <p className="text-sm text-[#8E8E93]">공감해요</p>
              <p className="mt-2 text-2xl font-bold text-black">
                {empathizeCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/70 bg-white/86 p-5 shadow-sm backdrop-blur-2xl">
          <h2 className="text-lg font-bold text-black">
            신고 사유별 현황
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            최근 14일 동안 어떤 이유로 신고가 들어왔는지 확인합니다.
          </p>

          <div className="mt-5 space-y-4">
            {reportReasonRows.map((row) => (
              <div key={row.reason}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700">
                    {row.label}
                  </span>
                  <span className="text-[#8E8E93]">{row.count}</span>
                </div>

                <div className="h-3 rounded-full bg-[#ffe2d2]">
                  <div
                    className="h-3 rounded-full bg-[#ff4b00]"
                    style={{
                      width: `${getPercent(row.count, maxReportReasonCount)}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {reportReasonRows.length === 0 && (
              <p className="text-sm text-[#8E8E93]">
                최근 14일 동안 신고가 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/admin/reports"
            className="block rounded-2xl border border-stone-300 bg-white px-5 py-4 text-center font-semibold text-stone-700"
          >
            신고 목록 보기
          </Link>

          <Link
            href="/admin/posts"
            className="block rounded-2xl border border-stone-300 bg-white px-5 py-4 text-center font-semibold text-stone-700"
          >
            게시글 관리
          </Link>

          <Link
            href="/admin/comments"
            className="block rounded-2xl border border-stone-300 bg-white px-5 py-4 text-center font-semibold text-stone-700"
          >
            댓글 관리
          </Link>
        </div>
      </section>
    </main>
  )
}
