import Link from 'next/link'
import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import { formatRelativeTime, getBoardPresentation } from '@/lib/communityPresentation'
import { UrgentPrayerBadge } from '@/app/components/UrgentPrayerBadge'
import { isUrgentPrayerPost } from '@/lib/urgentPrayer'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '검색 | 언블라인드',
  description: '언블라인드의 기도와 고민 게시글을 검색합니다.',
}

type SearchPageProps = { searchParams: Promise<{ q?: string }> }
type SearchPost = { id: string; board: string; title: string; content: string; created_at: string; tags: string[] | null }

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { supabase } = await requireBetaUser()
  const { q = '' } = await searchParams
  const query = q.trim().slice(0, 60)
  let posts: SearchPost[] = []

  if (query) {
    const safeQuery = query.replace(/[,%()]/g, ' ')
    const { data } = await supabase
      .from('posts')
      .select('id, board, title, content, created_at, tags')
      .eq('status', 'visible')
      .or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<SearchPost[]>()
    posts = data ?? []
  }

  return (
    <AppShell bottomBar={<BottomTabBar />}>
      <form method="get" role="search" className="mb-4 flex gap-2">
        <label className="ub-search-control flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 text-[var(--ub-text-primary)] shadow-sm">
          <SystemIcon name="search" size={19} className="shrink-0 text-[var(--ub-text-tertiary)]" />
          <input autoFocus name="q" defaultValue={query} aria-label="게시글 검색" placeholder="게시글 검색" className="ub-search-input min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)]" />
        </label>
        <button className="min-h-12 rounded-[16px] bg-[var(--ub-color-brand)] px-4 text-[15px] font-bold text-white shadow-sm">검색</button>
      </form>

      <section className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)] shadow-sm">
        {posts.map((post) => {
          const board = getBoardPresentation(post.board)
          const isUrgent = isUrgentPrayerPost(post.board, post.tags)
          return <Link key={post.id} href={`/post/${post.id}`} className="block border-b border-[var(--ub-separator)] px-4 py-4 last:border-0">
            <p className="flex items-center gap-1 text-[11px] text-[var(--ub-text-tertiary)]"><Emoji3D name={board.icon} size={16} /> {board.name} · {formatRelativeTime(post.created_at)}</p>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">{isUrgent && <UrgentPrayerBadge compact />}<h2 className="min-w-0 truncate text-[15px] font-bold text-[var(--ub-text-primary)]">{post.title}</h2></div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--ub-text-secondary)]">{post.content}</p>
          </Link>
        })}
        {!query && <p className="px-5 py-12 text-center text-[14px] text-[var(--ub-text-secondary)]">찾고 싶은 글의 제목이나 내용을 입력하세요.</p>}
        {query && posts.length === 0 && <p className="px-5 py-12 text-center text-[14px] text-[var(--ub-text-secondary)]">검색 결과가 없습니다.</p>}
      </section>
    </AppShell>
  )
}
