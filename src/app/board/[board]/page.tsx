import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import {
  AppShell,
  BottomTabBar,
  IosListGroup,
  IosListRow,
  NoticeCard,
  PageHeader,
  PrimaryLink,
} from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

const boardNames: Record<string, string> = {
  prayer: '기도요청',
  faith: '신앙고민',
  church: '교회생활',
  work: '진로/직장',
  relationship: '연애/결혼',
}

const boardDescriptions: Record<string, string> = {
  prayer: '함께 기도받고 싶은 제목을 조용히 나누는 공간입니다.',
  faith: '기도, 말씀, 예배, 신앙 회의에 대한 고민을 나눕니다.',
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
  comments: { count: number }[]
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 1000 / 60)

  if (diffMinutes < 1) return '방금'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString('ko-KR')
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
      comments(count)
    `)
    .eq('board', board)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .returns<PostRow[]>()

  const activeTab =
    board === 'prayer' ||
    board === 'faith' ||
    board === 'church' ||
    board === 'work' ||
    board === 'relationship'
      ? board
      : undefined

  return (
    <AppShell bottomBar={<BottomTabBar active={activeTab} />}>
      <PageHeader
        eyebrow="언블라인드"
        title={boardName}
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

      <IosListGroup
        title="최근 글"
        footer="글을 누르면 상세 화면으로 이동합니다. 사용자 화면에서는 작성자 정보가 공개되지 않습니다."
      >
        {posts?.map((post) => {
          const commentCount = post.comments?.[0]?.count ?? 0
          const preview =
            post.content.length > 80
              ? `${post.content.slice(0, 80)}...`
              : post.content

          return (
            <IosListRow
              key={post.id}
              href={`/post/${post.id}`}
              title={post.title}
              subtitle={preview}
              trailing={
                <span className="whitespace-nowrap text-[13px]">
                  댓글 {commentCount} · {formatRelativeDate(post.created_at)}
                </span>
              }
            />
          )
        })}

        {posts?.length === 0 && !error && (
          <div className="px-4 py-10 text-center">
            <p className="text-[17px] font-semibold text-black">
              아직 글이 없습니다
            </p>

            <p className="mt-2 text-[15px] leading-[21px] text-[#3C3C43]/60">
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
      </IosListGroup>
    </AppShell>
  )
}
