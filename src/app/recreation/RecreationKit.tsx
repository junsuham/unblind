'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { SystemIcon, type SystemIconName } from '@/app/components/ui/SystemIcon'
import {
  formatRecreationPlayers,
  recommendRecreationGames,
  recreationCategoryLabels,
  recreationGames,
  recreationPlaceLabels,
  splitParticipantsIntoTeams,
  type RecreationCategory,
  type RecreationContext,
  type RecreationGame,
  type RecreationMood,
  type RecreationPlace,
} from '@/lib/recreationGames'
import styles from './recreation.module.css'

type MainView = 'discover' | 'tools'

const categoryIcons: Record<RecreationCategory, SystemIconName> = {
  icebreaker: 'sparkles',
  teamwork: 'people',
  active: 'sun',
  bible: 'prayer',
  calm: 'leaf',
  large: 'speaker',
}

const moodOptions: Array<{ value: RecreationMood | 'all'; label: string }> = [
  { value: 'all', label: '모두' },
  { value: 'easy', label: '가볍게' },
  { value: 'active', label: '신나게' },
  { value: 'teamwork', label: '협동' },
  { value: 'calm', label: '차분하게' },
  { value: 'bible', label: '말씀과 함께' },
]

const playerOptions = [6, 12, 20, 35, 60]
const minuteOptions = [5, 10, 15, 20, 30]

function scrollAppToTop() {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('.ub-app-scroll')?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  })
}

function parseParticipantNames(value: string) {
  return value
    .split(/[\n,]/)
    .map((name) => name.trim())
    .filter(Boolean)
}

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function AppTabs({ view, onChange }: { view: MainView; onChange: (view: MainView) => void }) {
  return (
    <nav className={styles.appTabs} aria-label="레크레이션 KIT 메뉴">
      <button
        type="button"
        aria-current={view === 'discover' ? 'page' : undefined}
        className={view === 'discover' ? styles.appTabActive : styles.appTab}
        onClick={() => onChange('discover')}
      >
        <SystemIcon name="dice" size={17} />
        게임 찾기
      </button>
      <button
        type="button"
        aria-current={view === 'tools' ? 'page' : undefined}
        className={view === 'tools' ? styles.appTabActive : styles.appTab}
        onClick={() => onChange('tools')}
      >
        <SystemIcon name="timer" size={17} />
        진행 도구
      </button>
    </nav>
  )
}

function Metric({ icon, children }: { icon: SystemIconName; children: React.ReactNode }) {
  return (
    <span className={styles.metric}>
      <SystemIcon name={icon} size={14} />
      {children}
    </span>
  )
}

function GameCard({
  game,
  recommended = false,
  favorite,
  onSelect,
  onFavorite,
}: {
  game: RecreationGame
  recommended?: boolean
  favorite: boolean
  onSelect: () => void
  onFavorite: () => void
}) {
  return (
    <article className={recommended ? styles.recommendCard : styles.gameCard}>
      <button type="button" className={styles.gameCardMain} onClick={onSelect}>
        <span className={styles.gameIcon} aria-hidden>
          <SystemIcon name={categoryIcons[game.category]} size={22} />
        </span>
        <span className={styles.gameCopy}>
          <span className={styles.gameCategory}>
            {recommended && <b>추천</b>}
            {recreationCategoryLabels[game.category]}
          </span>
          <strong className={styles.gameTitle}>{game.title}</strong>
          <span className={styles.gameSummary}>{game.summary}</span>
          <span className={styles.metrics}>
            <Metric icon="people">{formatRecreationPlayers(game)}</Metric>
            <Metric icon="timer">{game.minutes}분</Metric>
            <Metric icon="speaker">
              {game.noise === 'high' ? '활기참' : game.noise === 'medium' ? '보통' : '조용함'}
            </Metric>
          </span>
        </span>
        <span className={styles.chevron} aria-hidden>›</span>
      </button>
      <button
        type="button"
        aria-label={favorite ? `${game.title} 즐겨찾기 해제` : `${game.title} 즐겨찾기`}
        aria-pressed={favorite}
        onClick={onFavorite}
        className={favorite ? styles.favoriteActive : styles.favorite}
      >
        <SystemIcon name="bookmark" size={18} filled={favorite} />
      </button>
    </article>
  )
}

function QuickPlanner({
  context,
  onChange,
  onRecommend,
}: {
  context: RecreationContext
  onChange: (context: RecreationContext) => void
  onRecommend: () => void
}) {
  return (
    <section className={styles.planner} aria-labelledby="recreation-planner-title">
      <div className={styles.plannerHeader}>
        <div>
          <p className={styles.eyebrow}>QUICK MATCH</p>
          <h1 id="recreation-planner-title">지금 모임에 딱 맞게</h1>
          <p>인원과 상황만 고르면 바로 진행할 게임을 찾아드려요.</p>
        </div>
        <span className={styles.heroDice} aria-hidden>
          <SystemIcon name="dice" size={28} />
        </span>
      </div>

      <div className={styles.optionGrid}>
        <label className={styles.selectField}>
          <span>참여 인원</span>
          <select
            value={context.players}
            onChange={(event) => onChange({ ...context, players: Number(event.target.value) })}
          >
            {playerOptions.map((count) => (
              <option key={count} value={count}>{count}명{count === 60 ? ' 이상' : ''}</option>
            ))}
          </select>
        </label>
        <label className={styles.selectField}>
          <span>가능 시간</span>
          <select
            value={context.minutes}
            onChange={(event) => onChange({ ...context, minutes: Number(event.target.value) })}
          >
            {minuteOptions.map((minute) => (
              <option key={minute} value={minute}>{minute}분</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className={styles.choiceField}>
        <legend>장소</legend>
        <div className={styles.choiceRow}>
          {(Object.keys(recreationPlaceLabels) as RecreationPlace[]).map((place) => (
            <button
              key={place}
              type="button"
              aria-pressed={context.place === place}
              className={context.place === place ? styles.choiceActive : styles.choice}
              onClick={() => onChange({ ...context, place })}
            >
              {recreationPlaceLabels[place]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.choiceField}>
        <legend>분위기</legend>
        <div className={styles.moodScroller}>
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              type="button"
              aria-pressed={context.mood === mood.value}
              className={context.mood === mood.value ? styles.choiceActive : styles.choice}
              onClick={() => onChange({ ...context, mood: mood.value })}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.switchRow}>
        <span>
          <strong>준비물 없이</strong>
          <small>바로 시작할 수 있는 게임만 우선 추천</small>
        </span>
        <input
          type="checkbox"
          checked={Boolean(context.noMaterials)}
          onChange={(event) => onChange({ ...context, noMaterials: event.target.checked })}
        />
      </label>

      <button type="button" className={styles.primaryButton} onClick={onRecommend}>
        <SystemIcon name="sparkles" size={19} />
        맞춤 게임 3개 보기
      </button>
    </section>
  )
}

function CountdownTimer({ initialMinutes = 5 }: { initialMinutes?: number }) {
  const initialSeconds = Math.max(1, initialMinutes) * 60
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return

    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false)
          if ('vibrate' in navigator) navigator.vibrate?.([150, 80, 150])
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [running])

  const progress = Math.max(0, Math.min(1, seconds / initialSeconds))
  const ringStyle = {
    '--timer-progress': `${progress * 360}deg`,
  } as CSSProperties

  return (
    <section className={styles.toolCard} aria-labelledby="countdown-title">
      <div className={styles.toolHeading}>
        <span className={styles.toolIcon}><SystemIcon name="timer" size={21} /></span>
        <div>
          <h2 id="countdown-title">카운트다운</h2>
          <p>진행 중에도 화면이 한눈에 보여요.</p>
        </div>
      </div>
      <div className={styles.timerWrap}>
        <div className={styles.timerRing} style={ringStyle}>
          <time aria-live="polite">{formatClock(seconds)}</time>
          <span>{seconds === 0 ? '종료' : running ? '진행 중' : '준비'}</span>
        </div>
      </div>
      <div className={styles.timerControls}>
        <button
          type="button"
          aria-label={running ? '타이머 일시정지' : '타이머 시작'}
          className={styles.roundButton}
          onClick={() => setRunning((current) => !current)}
        >
          <SystemIcon name={running ? 'pause' : 'play'} size={21} filled />
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            setRunning(false)
            setSeconds(initialSeconds)
          }}
        >
          다시 시작
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setSeconds((current) => current + 60)}
        >
          +1분
        </button>
      </div>
    </section>
  )
}

type Team = { name: string; members: string[] }

function TeamBuilder({ compact = false }: { compact?: boolean }) {
  const [input, setInput] = useState('')
  const [teamCount, setTeamCount] = useState(2)
  const [teams, setTeams] = useState<Team[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [pickedName, setPickedName] = useState('')
  const [error, setError] = useState('')
  const names = useMemo(() => parseParticipantNames(input), [input])

  function createTeams() {
    if (names.length < 2) {
      setError('이름을 두 명 이상 입력해주세요.')
      return
    }

    const nextTeams = splitParticipantsIntoTeams(names, teamCount)
    setTeams(nextTeams)
    setScores(Object.fromEntries(nextTeams.map((team) => [team.name, 0])))
    setPickedName('')
    setError('')
  }

  function pickRandomName() {
    if (!names.length) {
      setError('먼저 참가자 이름을 입력해주세요.')
      return
    }
    setPickedName(names[Math.floor(Math.random() * names.length)])
    setError('')
  }

  return (
    <section className={styles.toolCard} aria-labelledby={compact ? 'session-team-title' : 'team-builder-title'}>
      <div className={styles.toolHeading}>
        <span className={styles.toolIcon}><SystemIcon name="shuffle" size={21} /></span>
        <div>
          <h2 id={compact ? 'session-team-title' : 'team-builder-title'}>팀 자동 편성</h2>
          <p>이름을 줄바꿈이나 쉼표로 구분해주세요.</p>
        </div>
      </div>

      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={compact ? 3 : 4}
        className={styles.nameInput}
        placeholder={'예: 은우\n하람\n주원\n다온'}
        aria-label="참가자 이름"
      />
      <div className={styles.teamActions}>
        <label>
          <span>팀 수</span>
          <select value={teamCount} onChange={(event) => setTeamCount(Number(event.target.value))}>
            {[2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}팀</option>)}
          </select>
        </label>
        <button type="button" className={styles.secondaryButton} onClick={pickRandomName}>
          한 명 뽑기
        </button>
        <button type="button" className={styles.primarySmallButton} onClick={createTeams}>
          <SystemIcon name="shuffle" size={16} />
          팀 나누기
        </button>
      </div>

      {error && <p className={styles.formError} role="alert">{error}</p>}
      {pickedName && (
        <div className={styles.randomResult} aria-live="polite">
          <span>이번 순서는</span>
          <strong>{pickedName}</strong>
        </div>
      )}

      {teams.length > 0 && (
        <div className={styles.teamGrid} aria-live="polite">
          {teams.map((team) => (
            <article key={team.name} className={styles.teamCard}>
              <div className={styles.teamCardHeader}>
                <strong>{team.name}</strong>
                <div className={styles.scoreControl} aria-label={`${team.name} 점수`}>
                  <button
                    type="button"
                    aria-label={`${team.name} 1점 빼기`}
                    onClick={() => setScores((current) => ({
                      ...current,
                      [team.name]: Math.max(0, (current[team.name] ?? 0) - 1),
                    }))}
                  >−</button>
                  <b>{scores[team.name] ?? 0}</b>
                  <button
                    type="button"
                    aria-label={`${team.name} 1점 더하기`}
                    onClick={() => setScores((current) => ({
                      ...current,
                      [team.name]: (current[team.name] ?? 0) + 1,
                    }))}
                  >+</button>
                </div>
              </div>
              <p>{team.members.join(' · ')}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function GameDetail({
  game,
  favorite,
  onFavorite,
  onBack,
}: {
  game: RecreationGame
  favorite: boolean
  onFavorite: () => void
  onBack: () => void
}) {
  const [live, setLive] = useState(false)
  const [step, setStep] = useState(0)

  if (live) {
    const currentStep = game.steps[step]
    const progress = ((step + 1) / game.steps.length) * 100

    return (
      <div className={styles.liveStack}>
        <header className={styles.liveHeader}>
          <button type="button" className={styles.backButton} onClick={() => setLive(false)}>
            ‹ 안내 보기
          </button>
          <span>LIVE MODE</span>
          <h1>{game.title}</h1>
          <div className={styles.progressTrack} aria-label={`진행 ${step + 1}/${game.steps.length}`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </header>

        <section className={styles.liveStep} aria-live="polite">
          <span>STEP {step + 1} / {game.steps.length}</span>
          <p>{currentStep}</p>
          <div className={styles.stepButtons}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >이전</button>
            {step < game.steps.length - 1 ? (
              <button
                type="button"
                className={styles.primarySmallButton}
                onClick={() => setStep((current) => current + 1)}
              >다음 단계</button>
            ) : (
              <button
                type="button"
                className={styles.primarySmallButton}
                onClick={() => setLive(false)}
              >진행 완료</button>
            )}
          </div>
        </section>

        <CountdownTimer initialMinutes={game.minutes} />
        <TeamBuilder compact />
      </div>
    )
  }

  return (
    <div className={styles.detailStack}>
      <button type="button" className={styles.backButton} onClick={onBack}>‹ 게임 목록</button>

      <article className={styles.detailHero}>
        <div className={styles.detailIcon}><SystemIcon name={categoryIcons[game.category]} size={30} /></div>
        <p>{recreationCategoryLabels[game.category]}</p>
        <h1>{game.title}</h1>
        <span>{game.summary}</span>
        <div className={styles.detailMetrics}>
          <Metric icon="people">{formatRecreationPlayers(game)}</Metric>
          <Metric icon="timer">약 {game.minutes}분</Metric>
          <Metric icon="home">{game.places.map((place) => recreationPlaceLabels[place]).join(' · ')}</Metric>
        </div>
        <button
          type="button"
          className={favorite ? styles.detailFavoriteActive : styles.detailFavorite}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <SystemIcon name="bookmark" size={17} filled={favorite} />
          {favorite ? '저장됨' : '즐겨찾기'}
        </button>
      </article>

      <section className={styles.detailSection}>
        <h2><SystemIcon name="sparkles" size={19} /> 시작 전 준비</h2>
        <p>{game.preparation}</p>
        <div className={styles.materialList}>
          {game.materials.length > 0
            ? game.materials.map((material) => <span key={material}>{material}</span>)
            : <span>준비물 없음</span>}
        </div>
      </section>

      <section className={styles.scriptCard}>
        <span>진행자가 그대로 읽어주세요</span>
        <blockquote>“{game.facilitatorScript}”</blockquote>
      </section>

      <section className={styles.detailSection}>
        <h2><SystemIcon name="flag" size={19} /> 진행 순서</h2>
        <ol className={styles.stepList}>
          {game.steps.map((item, index) => (
            <li key={item}><span>{index + 1}</span><p>{item}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.safetyCard}>
        <SystemIcon name="heart" size={20} />
        <div>
          <strong>안전하고 편안하게</strong>
          <p>{game.safety}</p>
        </div>
      </section>

      <button
        type="button"
        className={styles.startButton}
        onClick={() => {
          setStep(0)
          setLive(true)
          scrollAppToTop()
        }}
      >
        <SystemIcon name="play" size={20} filled />
        이 게임 진행하기
      </button>
    </div>
  )
}

function DiscoverView({
  favorites,
  onToggleFavorite,
  onSelect,
}: {
  favorites: Set<string>
  onToggleFavorite: (id: string) => void
  onSelect: (game: RecreationGame) => void
}) {
  const [context, setContext] = useState<RecreationContext>({
    players: 12,
    minutes: 20,
    place: 'indoor',
    mood: 'all',
    noMaterials: false,
  })
  const [recommendationContext, setRecommendationContext] = useState(context)
  const [category, setCategory] = useState<RecreationCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const recommendationRef = useRef<HTMLElement>(null)

  const recommendations = useMemo(
    () => recommendRecreationGames(recommendationContext, 3),
    [recommendationContext]
  )

  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko')
    return recreationGames.filter((game) => {
      if (category !== 'all' && game.category !== category) return false
      if (!normalizedQuery) return true
      return [game.title, game.summary, recreationCategoryLabels[game.category]]
        .some((value) => value.toLocaleLowerCase('ko').includes(normalizedQuery))
    })
  }, [category, query])

  return (
    <div className={styles.discoverStack}>
      <QuickPlanner
        context={context}
        onChange={setContext}
        onRecommend={() => {
          setRecommendationContext(context)
          window.requestAnimationFrame(() => recommendationRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          }))
        }}
      />

      <section ref={recommendationRef} className={styles.sectionBlock} aria-labelledby="matched-games-title">
        <div className={styles.sectionHeader}>
          <div>
            <p>MATCHED FOR YOU</p>
            <h2 id="matched-games-title">바로 하기 좋은 3가지</h2>
          </div>
          <span>{recommendationContext.players}명 · {recommendationContext.minutes}분</span>
        </div>
        <div className={styles.cardList}>
          {recommendations.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              recommended
              favorite={favorites.has(game.id)}
              onSelect={() => onSelect(game)}
              onFavorite={() => onToggleFavorite(game.id)}
            />
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="all-games-title">
        <div className={styles.sectionHeader}>
          <div>
            <p>PLAYBOOK</p>
            <h2 id="all-games-title">전체 게임</h2>
          </div>
          <span>{filteredGames.length}개</span>
        </div>

        <label className={styles.searchField}>
          <SystemIcon name="search" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="게임 이름이나 분위기 검색"
            aria-label="레크레이션 게임 검색"
          />
          {query && (
            <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}>
              <SystemIcon name="close" size={15} />
            </button>
          )}
        </label>

        <div className={styles.categoryScroller} aria-label="게임 종류">
          <button
            type="button"
            aria-pressed={category === 'all'}
            className={category === 'all' ? styles.categoryActive : styles.category}
            onClick={() => setCategory('all')}
          >전체</button>
          {(Object.keys(recreationCategoryLabels) as RecreationCategory[]).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={category === item ? styles.categoryActive : styles.category}
              onClick={() => setCategory(item)}
            >
              <SystemIcon name={categoryIcons[item]} size={15} />
              {recreationCategoryLabels[item]}
            </button>
          ))}
        </div>

        <div className={styles.cardList}>
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              favorite={favorites.has(game.id)}
              onSelect={() => onSelect(game)}
              onFavorite={() => onToggleFavorite(game.id)}
            />
          ))}
          {filteredGames.length === 0 && (
            <div className={styles.emptyState}>
              <SystemIcon name="search" size={24} />
              <strong>일치하는 게임이 없어요</strong>
              <span>검색어나 종류를 조금 넓혀보세요.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function RecreationKit() {
  const [view, setView] = useState<MainView>('discover')
  const [selectedGame, setSelectedGame] = useState<RecreationGame | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem('unblind-recreation-favorites-v1')
        if (stored) setFavorites(new Set(JSON.parse(stored) as string[]))
      } catch {
        // Favorites are optional when Safari private mode blocks storage.
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        window.localStorage.setItem('unblind-recreation-favorites-v1', JSON.stringify([...next]))
      } catch {
        // Keep the in-memory state when storage is unavailable.
      }
      return next
    })
  }

  if (selectedGame) {
    return (
      <GameDetail
        game={selectedGame}
        favorite={favorites.has(selectedGame.id)}
        onFavorite={() => toggleFavorite(selectedGame.id)}
        onBack={() => {
          setSelectedGame(null)
          scrollAppToTop()
        }}
      />
    )
  }

  return (
    <div className={styles.kitRoot}>
      <AppTabs
        view={view}
        onChange={(nextView) => {
          setView(nextView)
          scrollAppToTop()
        }}
      />

      {view === 'discover' ? (
        <DiscoverView
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelect={(game) => {
            setSelectedGame(game)
            scrollAppToTop()
          }}
        />
      ) : (
        <div className={styles.toolsStack}>
          <header className={styles.toolsIntro}>
            <span><SystemIcon name="trophy" size={22} /></span>
            <div>
              <p>HOST CONSOLE</p>
              <h1>진행에 필요한 도구만</h1>
              <small>팀 편성부터 점수와 시간까지 한 화면에서 관리하세요.</small>
            </div>
          </header>
          <CountdownTimer />
          <TeamBuilder />
        </div>
      )}
    </div>
  )
}
