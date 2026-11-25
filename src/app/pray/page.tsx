import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { requireBetaUser } from '@/lib/betaAuth'
import { isUrgentPrayerPost } from '@/lib/urgentPrayer'
import PrayerSession, { type PrayerSessionPost } from './PrayerSession'
import { PrayerRoomScene } from './PrayerRoomScene'
import { generateBiblicalNickname } from '@/lib/profile'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '기도의 방 | 언블라인드',
  description: '도트 캐릭터와 골고다 언덕을 오르고, 예배당에서 함께 기도합니다.',
}

type PrayerPostRow = {
  id: string
  author_user_id: string | null
  title: string
  content: string
  tags: string[] | null
}

function shuffle<T>(values: T[]) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export default async function PrayTogetherPage() {
  const { supabase, user, profile } = await requireBetaUser()
  const [{ data: posts }, { data: blockedRows }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, author_user_id, title, content, tags')
      .eq('board', 'prayer')
      .eq('status', 'visible')
      .in('prayer_stage', ['requested', 'praying'])
      .neq('author_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<PrayerPostRow[]>(),
    supabase
      .from('user_blocks')
      .select('blocked_user_id')
      .eq('blocker_user_id', user.id),
  ])

  const blockedIds = new Set(
    (blockedRows ?? []).map((item) => item.blocked_user_id)
  )
  const available = (posts ?? []).filter(
    (post) => !post.author_user_id || !blockedIds.has(post.author_user_id)
  )
  const urgent = shuffle(
    available.filter((post) => isUrgentPrayerPost('prayer', post.tags))
  )
  const regular = shuffle(
    available.filter((post) => !isUrgentPrayerPost('prayer', post.tags))
  )
  const sessionPosts: PrayerSessionPost[] = [...urgent, ...regular]
    .slice(0, 5)
    .map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      urgent: isUrgentPrayerPost('prayer', post.tags),
    }))

  return (
    <AppShell topTitle="기도의 방" bottomBar={<BottomTabBar active="prayer" />}>
      <h1 className="sr-only">기도의 방</h1>
      <PrayerRoomScene storageScope={user.id} characterName={profile.nickname || generateBiblicalNickname(user.id)} />
      <details className="ub-liquid-card mt-3 overflow-hidden">
        <summary className="min-h-11 cursor-pointer px-4 py-3 text-[14px] font-bold text-[var(--ub-text-primary)]">기도 제목 놓고 기도하기</summary>
        <div className="px-3 pb-3">
          <PrayerSession posts={sessionPosts} />
        </div>
      </details>
      <nav aria-label="기도 게시판 바로가기" className="mt-3 grid grid-cols-2 gap-2 text-center">
        <Link href="/board/prayer" className="ub-liquid-card flex min-h-11 items-center justify-center px-2 text-[12px] font-bold text-[var(--ub-text-primary)]">기도 게시판</Link>
        <Link href="/post/new?board=prayer" className="ub-liquid-card flex min-h-11 items-center justify-center px-2 text-[12px] font-bold text-[var(--ub-text-primary)]">기도 요청 쓰기</Link>
      </nav>
    </AppShell>
  )
}
