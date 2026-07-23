import Link from 'next/link'
import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import { isAdminUser } from '@/lib/adminRole'
import LogoutButton from '@/app/components/LogoutButton'
import { generateBiblicalNickname } from '@/lib/profile'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '내 정보 | 언블라인드',
  description: '내 글, 댓글, 기도, 저장 기록과 계정 설정을 확인합니다.',
}

function koreaDateKey(value: Date | string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function getPrayerStreak(values: string[]) {
  const prayedDays = new Set(values.map(koreaDateKey))
  const cursor = new Date()
  const today = koreaDateKey(cursor)
  cursor.setDate(cursor.getDate() - 1)
  const yesterday = koreaDateKey(cursor)

  if (!prayedDays.has(today) && !prayedDays.has(yesterday)) return 0
  if (prayedDays.has(today)) cursor.setDate(cursor.getDate() + 1)

  let streak = 0
  while (prayedDays.has(koreaDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default async function ActivityPage() {
  const { supabase, user } = await requireBetaUser()
  const [{ data: posts }, { data: comments }, { data: prayers }, { data: saves }, { data: profile }, admin] = await Promise.all([
    supabase.from('posts').select('id, title, created_at').eq('author_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('comments').select('id, post_id, content, created_at').eq('author_user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('reactions').select('post_id, created_at, posts(title)').eq('actor_key', `user:${user.id}`).eq('type', 'pray').order('created_at', { ascending: false }).limit(60),
    supabase.from('saved_posts').select('post_id, created_at, posts(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('user_profiles').select('nickname').eq('user_id', user.id).maybeSingle<{ nickname: string }>(),
    isAdminUser(user),
  ])

  const sections = [
    { title: '내가 쓴 글', items: (posts ?? []).map((item) => ({ href: `/post/${item.id}`, title: item.title })) },
    { title: '내 댓글', items: (comments ?? []).map((item) => ({ href: `/post/${item.post_id}`, title: item.content })) },
    { title: '내가 기도한 글', items: (prayers ?? []).slice(0, 20).map((item) => ({ href: `/post/${item.post_id}`, title: (item.posts as unknown as { title?: string } | null)?.title ?? '기도한 게시글' })) },
    { title: '저장한 글', items: (saves ?? []).map((item) => ({ href: `/post/${item.post_id}`, title: (item.posts as unknown as { title?: string } | null)?.title ?? '저장한 게시글' })) },
  ]
  const prayerStreak = getPrayerStreak((prayers ?? []).map((item) => item.created_at))

  return (
    <AppShell topTitle="내 정보" bottomBar={<BottomTabBar />}>
      <div className="mb-4 flex min-h-10 items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-left text-[17px] font-bold tracking-[-0.2px] text-[var(--ub-text-on-brand-primary)]">
          {profile?.nickname ?? generateBiblicalNickname(user.id)}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <LogoutButton iconOnly />
          {admin && (
            <Link
              href="/admin"
              aria-label="관리자 센터"
              title="관리자 센터"
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ub-color-brand)] transition-colors active:bg-[var(--ub-surface-pressed)]"
            >
              <SystemIcon name="settings" size={21} />
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <Link
          href="/journey"
          className="flex min-h-[76px] items-center gap-3 rounded-[18px] bg-[linear-gradient(135deg,var(--ub-surface-card-strong),var(--ub-surface-brand-soft))] px-4 shadow-sm active:bg-[var(--ub-surface-pressed)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--ub-color-brand)] text-white">
            <SystemIcon name="leaf" size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-[15px] text-[var(--ub-text-primary)]">나의 신앙 여정</strong>
            <span className="mt-0.5 block truncate text-[11px] text-[var(--ub-text-secondary)]">
              마음, 감사, 기도의 흐름을 돌아보세요
            </span>
          </span>
          <span className="text-[22px] text-[var(--ub-text-tertiary)]" aria-hidden>›</span>
        </Link>
        <section aria-label="기도 활동" className="grid grid-cols-2 overflow-hidden rounded-[18px] bg-[var(--ub-surface-card-strong)] text-center shadow-sm">
          <div className="border-r border-[var(--ub-separator)] px-3 py-4">
            <p className="text-[22px] font-extrabold text-[var(--ub-color-brand)]">{prayerStreak}일</p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--ub-text-secondary)]">연속 기도</p>
          </div>
          <div className="px-3 py-4">
            <p className="text-[22px] font-extrabold text-[var(--ub-color-brand)]">{prayers?.length ?? 0}</p>
            <p className="mt-1 text-[12px] font-semibold text-[var(--ub-text-secondary)]">최근 기도한 글</p>
          </div>
        </section>
        <nav aria-label="계정 메뉴" className="grid grid-cols-3 gap-2">
          <Link href="/settings/account" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[16px] bg-[var(--ub-surface-card-strong)] text-[12px] font-semibold text-[var(--ub-text-primary)] shadow-sm active:bg-[var(--ub-surface-pressed)]">
            <SystemIcon name="person" size={20} className="text-[var(--ub-color-brand)]" />계정
          </Link>
          <Link href="/notifications" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[16px] bg-[var(--ub-surface-card-strong)] text-[12px] font-semibold text-[var(--ub-text-primary)] shadow-sm active:bg-[var(--ub-surface-pressed)]">
            <SystemIcon name="bell" size={20} className="text-[var(--ub-color-brand)]" />알림
          </Link>
          <Link href="/support" className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[16px] bg-[var(--ub-surface-card-strong)] text-[12px] font-semibold text-[var(--ub-text-primary)] shadow-sm active:bg-[var(--ub-surface-pressed)]">
            <SystemIcon name="message" size={20} className="text-[var(--ub-color-brand)]" />도움말
          </Link>
        </nav>
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
