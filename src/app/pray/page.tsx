import type { Metadata } from 'next'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import { requireBetaUser } from '@/lib/betaAuth'
import { isUrgentPrayerPost } from '@/lib/urgentPrayer'
import PrayerSession, { type PrayerSessionPost } from './PrayerSession'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '5분 함께 기도 | 언블라인드',
  description: '현재 기도가 필요한 익명 요청을 한 장씩 차분히 함께 기도합니다.',
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
  const { supabase, user } = await requireBetaUser()
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
    <AppShell topTitle="함께 기도" bottomBar={<BottomTabBar active="prayer" />}>
      <PrayerSession posts={sessionPosts} />
    </AppShell>
  )
}
