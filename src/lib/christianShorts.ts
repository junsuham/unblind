const CHRISTIAN_TAGS = [
  '기독교',
  '크리스천',
  '성경',
  '말씀',
  '기도',
  '간증',
  '복음',
  '예수',
  '하나님',
  '교회',
  '찬양',
  '예배',
  '청년신앙',
  'christian',
  'bible',
  'jesus',
  'gospel',
  'worship',
  'prayer',
] as const

const SHORTS_TAGS = ['shorts', '쇼츠', 'youtubeshorts'] as const

const BLOCKED_TERMS = [
  '성인방송',
  '도박',
  '코인리딩',
  '선거운동',
  '정치선동',
  '혐오',
  '금전요구',
  '계좌후원',
  '신천지',
  '하나님의교회',
  '여호와의증인',
  '사이비',
] as const

const SEARCH_QUERY = [
  '기독교 쇼츠',
  '성경 쇼츠',
  '기도 쇼츠',
  '간증 쇼츠',
  '복음 쇼츠',
  '찬양 쇼츠',
  '예수 쇼츠',
  '청년신앙 쇼츠',
].join('|')

const FEED_REVALIDATE_SECONDS = 21_600
const MAX_SHORTS_SECONDS = 180

type YouTubeThumbnail = {
  url?: string
  width?: number
  height?: number
}

export type YouTubeVideoResource = {
  id?: string
  snippet?: {
    title?: string
    description?: string
    channelId?: string
    channelTitle?: string
    publishedAt?: string
    tags?: string[]
    liveBroadcastContent?: string
    thumbnails?: Record<string, YouTubeThumbnail>
  }
  contentDetails?: {
    duration?: string
  }
  status?: {
    privacyStatus?: string
    embeddable?: boolean
    madeForKids?: boolean
    selfDeclaredMadeForKids?: boolean
  }
}

type YouTubeSearchResponse = {
  items?: Array<{ id?: { videoId?: string } }>
  error?: { message?: string }
}

type YouTubeVideosResponse = {
  items?: YouTubeVideoResource[]
  error?: { message?: string }
}

export type ChristianShortVideo = {
  id: string
  title: string
  channelId: string
  channelTitle: string
  publishedAt: string
  durationSeconds: number
  thumbnailUrl: string
  matchedTags: string[]
}

export type ChristianShortsFeed = {
  status: 'ready' | 'not-configured' | 'unavailable'
  videos: ChristianShortVideo[]
  message?: string
}

function normalizeToken(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/^#+/, '')
    .replace(/[\s_.-]+/g, '')
}

function extractHashtags(value: string) {
  return Array.from(value.matchAll(/#[\p{L}\p{N}_.-]+/gu), (match) => match[0])
}

function decodeYouTubeText(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function isSafeYoutubeId(value: string) {
  return /^[A-Za-z0-9_-]{6,20}$/.test(value)
}

export function parseYouTubeDuration(value: string | undefined) {
  if (!value) return 0

  const match = value.match(
    /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/
  )
  if (!match) return 0

  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match
  return Math.round(
    Number(days) * 86_400 +
      Number(hours) * 3_600 +
      Number(minutes) * 60 +
      Number(seconds)
  )
}

function getThumbnailUrl(video: YouTubeVideoResource, id: string) {
  const thumbnails = video.snippet?.thumbnails
  const candidates = [
    thumbnails?.maxres,
    thumbnails?.standard,
    thumbnails?.high,
    thumbnails?.medium,
    thumbnails?.default,
  ]

  for (const thumbnail of candidates) {
    if (!thumbnail?.url) continue

    try {
      const url = new URL(thumbnail.url)
      if (url.protocol === 'https:' && url.hostname === 'i.ytimg.com') {
        return url.href
      }
    } catch {
      // Ignore malformed thumbnail metadata and use the canonical fallback.
    }
  }

  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

function findMatchedChristianTags(tokens: string[]) {
  return CHRISTIAN_TAGS.filter((tag) => {
    const normalizedTag = normalizeToken(tag)
    return tokens.some((token) => token === normalizedTag || token.includes(normalizedTag))
  }).map((tag) => `#${tag}`)
}

export function filterChristianShortVideos(
  videos: YouTubeVideoResource[],
  preferredOrder: string[] = []
) {
  const preferredIndex = new Map(preferredOrder.map((id, index) => [id, index]))
  const filtered = videos.flatMap<ChristianShortVideo>((video) => {
    const id = video.id?.trim() ?? ''
    const snippet = video.snippet
    const status = video.status
    const durationSeconds = parseYouTubeDuration(video.contentDetails?.duration)

    if (!isSafeYoutubeId(id) || !snippet?.title || !snippet.channelTitle) return []
    if (durationSeconds < 1 || durationSeconds > MAX_SHORTS_SECONDS) return []
    if (status?.privacyStatus && status.privacyStatus !== 'public') return []
    if (status?.embeddable === false) return []
    if (status?.madeForKids || status?.selfDeclaredMadeForKids) return []
    if (snippet.liveBroadcastContent && snippet.liveBroadcastContent !== 'none') return []

    const metadataTags = snippet.tags ?? []
    const hashtags = extractHashtags(`${snippet.title} ${snippet.description ?? ''}`)
    const tokens = [...metadataTags, ...hashtags].map(normalizeToken).filter(Boolean)
    const matchedTags = findMatchedChristianTags(tokens)
    const hasShortsTag = tokens.some((token) =>
      SHORTS_TAGS.some((shortsTag) => token === normalizeToken(shortsTag))
    )
    const moderationText = normalizeToken(
      `${snippet.title} ${snippet.description ?? ''} ${metadataTags.join(' ')}`
    )
    const hasBlockedTerm = BLOCKED_TERMS.some((term) =>
      moderationText.includes(normalizeToken(term))
    )

    if (!hasShortsTag || matchedTags.length === 0 || hasBlockedTerm) return []

    return [{
      id,
      title: decodeYouTubeText(snippet.title).slice(0, 160),
      channelId: snippet.channelId?.slice(0, 80) ?? '',
      channelTitle: decodeYouTubeText(snippet.channelTitle).slice(0, 100),
      publishedAt: snippet.publishedAt ?? '',
      durationSeconds,
      thumbnailUrl: getThumbnailUrl(video, id),
      matchedTags: matchedTags.slice(0, 3),
    }]
  })

  return filtered.sort((left, right) => {
    const leftIndex = preferredIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER
    const rightIndex = preferredIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER
    return leftIndex - rightIndex
  })
}

export async function getChristianShortsFeed(): Promise<ChristianShortsFeed> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim()
  if (!apiKey) {
    return {
      status: 'not-configured',
      videos: [],
      message: 'YouTube Shorts 연결을 준비 중입니다.',
    }
  }

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('key', apiKey)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('q', SEARCH_QUERY)
  searchUrl.searchParams.set('maxResults', '50')
  searchUrl.searchParams.set('order', 'date')
  searchUrl.searchParams.set('regionCode', 'KR')
  searchUrl.searchParams.set('relevanceLanguage', 'ko')
  searchUrl.searchParams.set('safeSearch', 'strict')
  searchUrl.searchParams.set('videoDuration', 'short')
  searchUrl.searchParams.set('videoEmbeddable', 'true')
  searchUrl.searchParams.set('videoSyndicated', 'true')

  try {
    const searchResponse = await fetch(searchUrl, {
      next: {
        revalidate: FEED_REVALIDATE_SECONDS,
        tags: ['youtube-christian-shorts-search'],
      },
    })
    const searchPayload = (await searchResponse.json()) as YouTubeSearchResponse
    if (!searchResponse.ok) {
      throw new Error(searchPayload.error?.message ?? 'YouTube Shorts search failed')
    }

    const videoIds = Array.from(new Set(
      (searchPayload.items ?? [])
        .map((item) => item.id?.videoId?.trim() ?? '')
        .filter(isSafeYoutubeId)
    )).slice(0, 50)

    if (videoIds.length === 0) {
      return { status: 'ready', videos: [] }
    }

    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    detailsUrl.searchParams.set('key', apiKey)
    detailsUrl.searchParams.set('part', 'snippet,contentDetails,status')
    detailsUrl.searchParams.set('id', videoIds.join(','))
    detailsUrl.searchParams.set('hl', 'ko')

    const detailsResponse = await fetch(detailsUrl, {
      next: {
        revalidate: FEED_REVALIDATE_SECONDS,
        tags: ['youtube-christian-shorts-details'],
      },
    })
    const detailsPayload = (await detailsResponse.json()) as YouTubeVideosResponse
    if (!detailsResponse.ok) {
      throw new Error(detailsPayload.error?.message ?? 'YouTube video details failed')
    }

    return {
      status: 'ready',
      videos: filterChristianShortVideos(detailsPayload.items ?? [], videoIds).slice(0, 24),
    }
  } catch (error) {
    console.error(
      'Christian Shorts feed failed:',
      error instanceof Error ? error.message : 'Unknown YouTube API error'
    )
    return {
      status: 'unavailable',
      videos: [],
      message: '영상을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.',
    }
  }
}
