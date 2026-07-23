import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { getChristianShortsFeed } from '@/lib/christianShorts'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import ChristianShortsFeed from './ChristianShortsFeed'
import styles from './shorts.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '크리스천 쇼츠 | UNBLIND',
  description: '쇼츠 중독, 피할 수 없으면 하나님으로 채우기',
}

export default async function ChristianShortsPage() {
  await requireBetaUser()
  const feed = await getChristianShortsFeed()

  return (
    <AppShell
      topTitle="크리스천 쇼츠"
      bottomBar={<BottomTabBar active="home" />}
      contentMode="contained"
    >
      <div className={styles.shortsPage}>
        <p className={styles.description}>
          쇼츠 중독, 피할 수 없으면 하나님으로 채우기
        </p>

        <ChristianShortsFeed
          videos={feed.videos}
          nextPageToken={feed.nextPageToken}
          message={feed.message}
        />

        <nav className={styles.policyLinks} aria-label="외부 서비스 정책">
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube 약관</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 정책</a>
        </nav>
      </div>
    </AppShell>
  )
}
