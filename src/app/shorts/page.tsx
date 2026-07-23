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
          <p>기독교 관련 태그를 통과한 3분 이하 영상</p>
          <p>영상과 채널 정보는 YouTube가 제공합니다</p>
        </div>
        <div className={styles.policyLinks}>
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube 약관</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 정책</a>
        </div>
      </div>

      <ChristianShortsFeed videos={feed.videos} message={feed.message} />
    </AppShell>
  )
}
