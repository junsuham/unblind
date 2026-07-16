import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar, PageHeader } from '@/app/components/ui/AppShell'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const { supabase, user } = await requireBetaUser()
  const [{ data: posts }, { data: comments }, { data: saves }] = await Promise.all([
    supabase.from('posts').select('id, title, created_at').eq('author_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('comments').select('id, post_id, content, created_at').eq('author_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('saved_posts').select('post_id, created_at, posts(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  const sections = [
    { title: '내가 쓴 글', items: (posts ?? []).map((item) => ({ href: `/post/${item.id}`, title: item.title })) },
    { title: '내 댓글', items: (comments ?? []).map((item) => ({ href: `/post/${item.post_id}`, title: item.content })) },
    { title: '저장한 글', items: (saves ?? []).map((item) => ({ href: `/post/${item.post_id}`, title: (item.posts as unknown as { title?: string } | null)?.title ?? '저장한 게시글' })) },
  ]

  return (
    <AppShell bottomBar={<BottomTabBar />}>
      <PageHeader eyebrow="나의 기록" title="📚 내 활동" titleSize="compact" />
      <Link href="/settings/account" className="mb-6 flex min-h-[52px] items-center justify-between rounded-[18px] bg-[var(--ub-surface-card-strong)] px-4 text-[15px] font-semibold text-[var(--ub-color-brand)] shadow-sm">계정·알림·차단 관리 <span className="text-[22px]">›</span></Link>
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <p className="mb-2 px-2 text-[12px] font-semibold text-[var(--ub-text-on-brand-tertiary)]">{section.title}</p>
            <div className="overflow-hidden rounded-[20px] bg-[var(--ub-surface-card-strong)]">
              {section.items.map((item, index) => <Link key={`${item.href}-${index}`} href={item.href} className="block truncate border-b border-[var(--ub-separator)] px-4 py-4 text-[14px] text-[var(--ub-text-primary)] last:border-b-0">{item.title}</Link>)}
              {section.items.length === 0 && <p className="px-4 py-8 text-center text-[13px] text-[var(--ub-text-tertiary)]">아직 기록이 없습니다.</p>}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  )
}
