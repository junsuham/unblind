import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import { getChristianShortsFeed } from '@/lib/christianShorts'
import { AppShell, BottomTabBar } from '@/app/components/ui/AppShell'
import ChristianShortsFeed from './ChristianShortsFeed'
import styles from './shorts.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '크리스천 쇼츠 | UNBLIND',
  description: '기독교 관련 태그를 기준으로 엄선한 YouTube Shorts 피드',
}

export default async function ChristianShortsPage() {
  await requireBetaUser()
  const feed = await getChristianShortsFeed()

  return (
    <AppShell topTitle="크리스천 쇼츠" bottomBar={<BottomTabBar active="home" />}>
      <div className={styles.intro}>
        <div className={styles.introCopy}>
          <p>기독교 관련 태그를 통과한 세로형 영상</p>
          <p>화면에 들어오면 음소거로 자동 재생됩니다</p>
        </div>
        <div className={styles.policyLinks}>
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube 약관</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 정책</a>
        </div>
      </div>

      <ChristianShortsFeed
        videos={feed.videos}
        nextPageToken={feed.nextPageToken}
        message={feed.message}
      />
    </AppShell>
  )
}
