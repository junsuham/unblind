import Link from 'next/link'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { isAdminUser } from '@/lib/adminRole'
import LogoutButton from '@/app/components/LogoutButton'
import { generateBiblicalNickname } from '@/lib/profile'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const { supabase, user } = await requireBetaUser()
  const [{ data: posts }, { data: comments }, { data: saves }, { data: profile }, admin] = await Promise.all([
    supabase.from('posts').select('id, title, created_at').eq('author_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('comments').select('id, post_id, content, created_at').eq('author_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('saved_posts').select('post_id, created_at, posts(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('user_profiles').select('nickname').eq('user_id', user.id).maybeSingle<{ nickname: string }>(),
    isAdminUser(user),
  ])

  const sections = [
    { title: '내가 쓴 글', items: (posts ?? []).map((item) => ({ href: `/post/${item.id}`, title: item.title })) },
    { title: '내 댓글', items: (comments ?? []).map((item) => ({ href: `/post/${item.post_id}`, title: item.content })) },
    { title: '저장한 글', items: (saves ?? []).map((item) => ({ href: `/post/${item.post_id}`, title: (item.posts as unknown as { title?: string } | null)?.title ?? '저장한 게시글' })) },
  ]

  return (
    <AppShell topTitle="내 정보" bottomBar={<BottomTabBar />}>
      <div className="mb-4 flex min-h-10 items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-left text-[17px] font-bold tracking-[-0.2px] text-white">
          {profile?.nickname ?? generateBiblicalNickname(user.id)}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <LogoutButton iconOnly />
          {admin && (
            <Link
              href="/admin"
              aria-label="관리자 센터"
              title="관리자 센터"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/72 transition-colors active:bg-white/10 active:text-white"
            >
              <SystemIcon name="settings" size={21} />
            </Link>
          )}
        </div>
      </div>
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
