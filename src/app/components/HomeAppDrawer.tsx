import { HomeAppLink } from './HomeAppTile'
import { HomePraisePlayer } from './HomePraisePlayer'
import type { PraisePlayerTrack } from './praisePlayerEvents'
import styles from './HomeAppDrawer.module.css'

export function HomeAppDrawer({
  tracks,
}: {
  tracks: PraisePlayerTrack[]
}) {
  return (
    <section className={styles.drawer} aria-labelledby="unblind-app-shortcuts">
      <h2 id="unblind-app-shortcuts" className={styles.title}>언블라인드 앱</h2>
      <ul className={styles.grid} role="list">
        <li>
          <HomeAppLink id="home-app-journey-help" href="/journey" label="나의 신앙 여정" tone="sage" description="체크인, 감사, 기도 리듬을 한눈에 보기" />
        </li>
        <li>
          <HomeAppLink id="home-app-manitto-help" href="/manitto/maker" label="마니또 만들기" tone="rose" description="모임 참가자를 등록하고 각자의 마니또를 비공개로 추첨" />
        </li>
        <li>
          <HomeAppLink id="home-app-gratitude-help" href="/gratitude" label="감사일기 챌린지" tone="apricot" description="하루 한 줄, 감사 달력, 익명 전달" />
        </li>
        <li>
          <HomeAppLink id="home-app-recreation-help" href="/recreation" label="모임 KIT" tone="blue" description="상황별 게임 추천, 팀 편성, 타이머, 점수판" />
        </li>
        <li>
          <HomeAppLink id="home-app-mbti-help" href="/mbti" label="성경 MBTI" tone="violet" description="나와 닮은 성경 속 믿음의 인물 찾기" />
        </li>
        <li>
          <HomeAppLink id="home-app-shorts-help" href="/shorts" label="크리스천 쇼츠" tone="coral" description="기독교 태그로 엄선한 3분 이하 영상" />
        </li>
        <li>
          <HomePraisePlayer initialTracks={tracks} />
        </li>
      </ul>
    </section>
  )
}
