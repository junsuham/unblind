import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  filterChristianShortVideos,
  getChristianShortsFeed,
  isLikelyAiGeneratedVideo,
  isSafeYouTubePageToken,
  parseYouTubeDuration,
  parseYouTubeViewCount,
  type YouTubeVideoResource,
} from '../src/lib/christianShorts'

const homePage = readFileSync(
  new URL('../src/app/page.tsx', import.meta.url),
  'utf8'
)
const homeAppDrawer = readFileSync(
  new URL('../src/app/components/HomeAppDrawer.tsx', import.meta.url),
  'utf8'
)

const shortsPage = readFileSync(
  new URL('../src/app/shorts/page.tsx', import.meta.url),
  'utf8'
)

const shortsClient = readFileSync(
  new URL('../src/app/shorts/ChristianShortsFeed.tsx', import.meta.url),
  'utf8'
)

const shortsStyles = readFileSync(
  new URL('../src/app/shorts/shorts.module.css', import.meta.url),
  'utf8'
)

const shortsApi = readFileSync(
  new URL('../src/app/api/shorts/route.ts', import.meta.url),
  'utf8'
)

const shortsLibrary = readFileSync(
  new URL('../src/lib/christianShorts.ts', import.meta.url),
  'utf8'
)

function video(overrides: Partial<YouTubeVideoResource> = {}): YouTubeVideoResource {
  return {
    id: 'abcDEF_1234',
    snippet: {
      title: '하루를 여는 말씀 #shorts #성경',
      description: '#크리스천 묵상',
      channelId: 'channel-1',
      channelTitle: '믿음의 하루',
      publishedAt: '2026-07-20T00:00:00Z',
      tags: ['shorts', '기독교', '성경'],
      liveBroadcastContent: 'none',
      thumbnails: {
        high: { url: 'https://i.ytimg.com/vi/abcDEF_1234/hqdefault.jpg' },
      },
    },
    contentDetails: { duration: 'PT1M12S' },
    status: {
      privacyStatus: 'public',
      embeddable: true,
      madeForKids: false,
    },
    statistics: { viewCount: '125000' },
    ...overrides,
  }
}

describe('Christian Shorts feed', () => {
  it('parses YouTube durations and enforces the three-minute boundary', () => {
    expect(parseYouTubeDuration('PT59S')).toBe(59)
    expect(parseYouTubeDuration('PT3M')).toBe(180)
    expect(parseYouTubeDuration('PT3M1S')).toBe(181)
    expect(parseYouTubeDuration('not-a-duration')).toBe(0)
  })

  it('parses bounded public view counts', () => {
    expect(parseYouTubeViewCount('125000')).toBe(125000)
    expect(parseYouTubeViewCount('')).toBe(0)
    expect(parseYouTubeViewCount('-1')).toBe(0)
    expect(parseYouTubeViewCount('not-a-number')).toBe(0)
  })

  it('accepts only bounded YouTube pagination tokens', () => {
    expect(isSafeYouTubePageToken('CAUQAA')).toBe(true)
    expect(isSafeYouTubePageToken('token_with-hyphen_123')).toBe(true)
    expect(isSafeYouTubePageToken('')).toBe(false)
    expect(isSafeYouTubePageToken('../unsafe?token=1')).toBe(false)
    expect(isSafeYouTubePageToken('a'.repeat(257))).toBe(false)
  })

  it('keeps only public, embeddable, non-child-directed tagged Shorts', () => {
    const accepted = filterChristianShortVideos([video()])

    expect(accepted).toHaveLength(1)
    expect(accepted[0]).toMatchObject({
      id: 'abcDEF_1234',
      channelTitle: '믿음의 하루',
      durationSeconds: 72,
      viewCount: 125000,
    })
    expect(accepted[0].matchedTags).toContain('#기독교')
  })

  it('rejects disclosed or explicitly described AI-generated videos without blocking AI topics', () => {
    const disclosedSynthetic = video({
      id: 'synthetic01',
      status: {
        privacyStatus: 'public',
        embeddable: true,
        containsSyntheticMedia: true,
      },
    })
    const explicitAiCreation = video({
      id: 'aiCreated01',
      snippet: {
        ...video().snippet,
        title: 'AI로 만든 성경 이야기 #shorts #성경',
      },
    })
    const aiTopic = video({
      id: 'aiTopic001',
      snippet: {
        ...video().snippet,
        title: 'AI 시대의 신앙은 어떻게 지켜야 할까 #shorts #기독교',
      },
    })
    const aiMusicTool = video({
      id: 'sunoVideo1',
      snippet: {
        ...video().snippet,
        description: '#크리스천 #Suno',
      },
    })

    expect(isLikelyAiGeneratedVideo(disclosedSynthetic)).toBe(true)
    expect(isLikelyAiGeneratedVideo(explicitAiCreation)).toBe(true)
    expect(isLikelyAiGeneratedVideo(aiTopic)).toBe(false)
    expect(isLikelyAiGeneratedVideo(aiMusicTool)).toBe(true)
    expect(
      filterChristianShortVideos([
        disclosedSynthetic,
        explicitAiCreation,
        aiTopic,
        aiMusicTool,
      ])
        .map((item) => item.id)
    ).toEqual(['aiTopic001'])
  })

  it('rejects long, unrelated, blocked, non-embeddable and made-for-kids videos', () => {
    const unrelated = video({
      id: 'unrelated01',
      snippet: {
        ...video().snippet,
        title: '일상 브이로그 #shorts',
        description: '#daily',
        tags: ['shorts', 'daily'],
      },
    })
    const blocked = video({
      id: 'blocked001',
      snippet: {
        ...video().snippet,
        title: '선거운동 기독교 쇼츠',
      },
    })
    const tooLong = video({ id: 'toolong001', contentDetails: { duration: 'PT3M1S' } })
    const notEmbeddable = video({
      id: 'noembed001',
      status: { privacyStatus: 'public', embeddable: false },
    })
    const madeForKids = video({
      id: 'forkids001',
      status: { privacyStatus: 'public', embeddable: true, madeForKids: true },
    })

    expect(filterChristianShortVideos([
      unrelated,
      blocked,
      tooLong,
      notEmbeddable,
      madeForKids,
    ])).toEqual([])
  })

  it.each([
    { title: '마음을 평안하게 하는 스님 법문 #shorts #기독교' },
    { title: '기도로 마음을 다스리는 법 #shorts #성경', channelTitle: '대한 불교 조계종' },
    { description: '하루 1분 반야심경 읽기 #예수님' },
    { tags: ['shorts', '기독교', '템플스테이'] },
    { localized: { title: '부&#8203;처님의 가르침' } },
    { description: 'An uplifting reflection #BuddhistWisdom #Christian' },
    { tags: ['shorts', 'bible', 'BuddhismForBeginners'] },
    { description: '仏教のお話 #bible #prayer' },
    { title: '라마단 기간에 기도하는 법 #shorts #기독교' },
    { channelTitle: 'Hindu Dharma' },
  ])('discards religion conflicts despite Christian tags: %o', (overrides) => {
    expect(filterChristianShortVideos([video({
      snippet: { ...video().snippet, ...overrides },
    })])).toEqual([])
  })

  it('requires content evidence instead of loose prayer words, unrelated hashtags or substring matches', () => {
    const subjects = [
      { title: '하루를 여는 기도 #shorts #기도', tags: ['기도'], description: '' },
      { title: '모바일 게임 하이라이트 #shorts #예수님', tags: ['bible'], description: '일상 인기 영상' },
      { title: '아침에 드리는 기도 #shorts', tags: ['bibleversary', 'unrelatedchristian'], description: '' },
      { title: '마음이 편안해지는 영성 이야기 #shorts', tags: ['christian', '성경'], description: '#기도 #복음' },
      { title: '하루를 여는 마음 명상과 기도 #shorts', tags: ['christian'], description: '' },
    ]
    expect(filterChristianShortVideos(subjects.map((subject, index) => video({
      id: `ambiguous0${index}`,
      snippet: { ...video().snippet, ...subject },
    })))).toEqual([])
  })

  it('allows explicit Christian titles and scripture references without relying on hashtag volume', () => {
    const subjects = [
      { title: '예수님이 가르쳐 주신 용서 #Shorts', tags: [], description: '' },
      { title: '시편 23:1 | 묵상 #쇼츠', tags: [], description: '' },
      { title: 'When I first read the Bible #Shorts', tags: [], description: '' },
      { title: '조용한 아침 예배 #Shorts', tags: [], description: '누가복음 5:1을 함께 읽습니다.' },
    ]
    expect(filterChristianShortVideos(subjects.map((subject, index) => video({
      id: `explicit00${index}`,
      snippet: { ...video().snippet, ...subject },
    })))).toHaveLength(subjects.length)
  })

  it.each([undefined, 'NEXT_PAGE'])('filters the retrieved YouTube page (%s) before returning videos', async (pageToken) => {
    const unqualified = video({
      id: 'nonfaith001',
      snippet: { ...video().snippet, title: '법륜스님의 법문 #shorts #성경' },
    })
    const http = vi.fn()
      .mockResolvedValueOnce(Response.json({
        items: [video(), unqualified].map(({ id }) => ({ id: { videoId: id } })),
        nextPageToken: 'NEXT_2',
      }))
      .mockResolvedValueOnce(Response.json({ items: [video(), unqualified] }))
    vi.stubEnv('YOUTUBE_API_KEY', 'test-key')
    vi.stubGlobal('fetch', http)
    try {
      const result = await getChristianShortsFeed(pageToken)
      expect(result.videos.map(({ id }) => id)).toEqual([video().id])
      expect(result.nextPageToken).toBe('NEXT_2')
      const search = http.mock.calls[0][0] as URL
      expect(search.searchParams.get('pageToken')).toBe(pageToken ?? null)
      expect(search.searchParams.get('q')).toContain('-불교')
    } finally {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
    }
  })

  it('prioritizes higher view counts and uses YouTube search order for ties', () => {
    const first = video({ id: 'firstVid01', statistics: { viewCount: '1000' } })
    const second = video({ id: 'secondVid1', statistics: { viewCount: '5000' } })
    const tied = video({ id: 'tiedVideo1', statistics: { viewCount: '5000' } })

    expect(
      filterChristianShortVideos(
        [first, second, tied],
        ['tiedVideo1', 'secondVid1', 'firstVid01']
      )
        .map((item) => item.id)
    ).toEqual(['tiedVideo1', 'secondVid1', 'firstVid01'])
  })

  it('links the feature from home and keeps the player policy-safe', () => {
    expect(homePage).toContain('<HomeAppDrawer')
    expect(homeAppDrawer).toContain('href="/shorts"')
    expect(homeAppDrawer).toContain('크리스천 쇼츠')
    expect(shortsPage).toContain('쇼츠 중독, 피할 수 없으면 하나님으로 채우기')
    expect(shortsPage).not.toContain('AI 제작물을 제외하고')
    expect(shortsPage).not.toContain('화면에 들어오면 음소거로 자동 재생됩니다')
    expect(shortsPage).toContain('https://www.youtube.com/t/terms')
    expect(shortsPage).toContain('https://policies.google.com/privacy')
    expect(shortsClient).toContain('https://www.youtube-nocookie.com/embed/')
    expect(shortsClient).toContain('autoplay=1&mute=1&playsinline=1')
    expect(shortsClient).toContain('loop=1&playlist=${video.id}')
    expect(shortsClient).toContain('referrerPolicy="strict-origin-when-cross-origin"')
    expect(shortsClient).toContain('setPageVisible(!document.hidden)')
    expect(shortsClient).toContain('조회 {formatViewCount(video.viewCount)}')
    expect(shortsClient).not.toContain('thumbnailButton')
    expect(shortsClient).not.toContain('download')
  })

  it('keeps a 9:16 player and automatically loads the next YouTube page', () => {
    expect(shortsStyles).toContain('aspect-ratio: 9 / 16')
    expect(shortsStyles).toContain('scroll-snap-type: y mandatory')
    expect(shortsStyles).toContain('.swipeSurface')
    expect(shortsStyles).toContain('bottom: 56px')
    expect(shortsStyles).toContain('height: 100%')
    expect(shortsPage).toContain('contentMode="contained"')
    expect(shortsClient).toContain("addEventListener('wheel', moveOneVideo, { passive: false })")
    expect(shortsClient).toContain('ref={loadMoreRef}')
    expect(shortsClient).toContain('/api/shorts?')
    expect(shortsClient).toContain("rootMargin: '0px 0px 120% 0px'")
    expect(shortsClient).toContain('MAX_CONSECUTIVE_EMPTY_PAGES = 3')
    expect(shortsClient).toContain('loadedTokens.current.has(followingToken)')
    expect(shortsApi).toContain("searchParams.get('pageToken')")
    expect(shortsApi).toContain('getChristianShortsFeed(pageToken)')
    expect(shortsLibrary).toContain("searchUrl.searchParams.set('order', 'viewCount')")
    expect(shortsLibrary).toContain("'snippet,contentDetails,status,statistics'")
  })
})
