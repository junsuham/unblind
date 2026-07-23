import { officialPraiseTracks, type OfficialPraiseTrack } from './officialPraiseTracks'

export const WEEKLY_PRAISE_LIMIT = 50

type YouTubeVideoResource = {
  id?: string
  snippet?: {
    title?: string
    channelId?: string
    channelTitle?: string
    publishedAt?: string
    liveBroadcastContent?: string
  }
  contentDetails?: { duration?: string }
  status?: { privacyStatus?: string; embeddable?: boolean }
  statistics?: { viewCount?: string }
}

type YouTubeVideosResponse = {
  items?: YouTubeVideoResource[]
  error?: { message?: string }
}

type YouTubeSearchResponse = {
  items?: Array<{ id?: { videoId?: string } }>
  error?: { message?: string }
}

const BLOCKED_TITLE_TERMS = [
  '설교', '말씀', '인터뷰', '브이로그', 'vlog', 'teaser', '티저',
  '예고', '광고', 'shorts', '쇼츠', '간증', '메시지', 'message',
] as const

function isSafeYouTubeId(value: string) {
  return /^[A-Za-z0-9_-]{6,20}$/.test(value)
}

function decodeYouTubeText(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

function parseDurationSeconds(value: string | undefined) {
  const match = value?.match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (!match) return 0
  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match
  return Math.round(
    Number(days) * 86_400 + Number(hours) * 3_600 + Number(minutes) * 60 + Number(seconds)
  )
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function fetchYouTubeJson<T extends { error?: { message?: string } }>(url: URL) {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const payload = (await response.json()) as T
  if (!response.ok) throw new Error(payload.error?.message ?? 'YouTube API request failed')
  return payload
}

async function fetchVideoDetails(ids: string[], apiKey: string) {
  const responses = await Promise.all(chunk(Array.from(new Set(ids)), 50).map(async (idChunk) => {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('part', 'snippet,contentDetails,status,statistics')
    url.searchParams.set('id', idChunk.join(','))
    url.searchParams.set('hl', 'ko')
    return fetchYouTubeJson<YouTubeVideosResponse>(url)
  }))
  return responses.flatMap((response) => response.items ?? [])
}

async function fetchRecentChannelVideoIds(
  channelIds: string[],
  apiKey: string,
  now: Date,
) {
  const publishedAfter = new Date(now)
  publishedAfter.setUTCDate(publishedAfter.getUTCDate() - 183)

  const responses = await Promise.allSettled(channelIds.map(async (channelId) => {
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('type', 'video')
    url.searchParams.set('channelId', channelId)
    url.searchParams.set('maxResults', '6')
    url.searchParams.set('order', 'date')
    url.searchParams.set('publishedAfter', publishedAfter.toISOString())
    url.searchParams.set('safeSearch', 'strict')
    url.searchParams.set('videoCategoryId', '10')
    url.searchParams.set('videoEmbeddable', 'true')
    url.searchParams.set('videoSyndicated', 'true')
    return fetchYouTubeJson<YouTubeSearchResponse>(url)
  }))

  return Array.from(new Set(responses.flatMap((result) => {
    if (result.status !== 'fulfilled') return []
    return (result.value.items ?? [])
      .map((item) => item.id?.videoId?.trim() ?? '')
      .filter(isSafeYouTubeId)
  })))
}

function isPlayablePraiseVideo(video: YouTubeVideoResource) {
  const title = video.snippet?.title?.trim() ?? ''
  const duration = parseDurationSeconds(video.contentDetails?.duration)
  const normalizedTitle = title.toLocaleLowerCase('ko-KR')

  return Boolean(
    isSafeYouTubeId(video.id?.trim() ?? '')
      && title
      && video.snippet?.channelId
      && video.snippet?.channelTitle
      && duration >= 90
      && duration <= 1_200
      && (!video.status?.privacyStatus || video.status.privacyStatus === 'public')
      && video.status?.embeddable !== false
      && (!video.snippet?.liveBroadcastContent || video.snippet.liveBroadcastContent === 'none')
      && !BLOCKED_TITLE_TERMS.some((term) => normalizedTitle.includes(term))
  )
}

export function rankWeeklyPraiseCandidates(
  videos: YouTubeVideoResource[],
  fallbackTracks: OfficialPraiseTrack[] = officialPraiseTracks,
  now = new Date(),
) {
  const seen = new Set<string>()
  const ranked = videos
    .filter(isPlayablePraiseVideo)
    .map((video) => {
      const publishedAt = Date.parse(video.snippet?.publishedAt ?? '')
      const ageDays = Number.isFinite(publishedAt)
        ? Math.max(0, (now.getTime() - publishedAt) / 86_400_000)
        : 365
      const views = Math.max(0, Number(video.statistics?.viewCount ?? 0))
      const popularity = Math.log10(views + 1) * 12
      const freshness = Math.max(0, 1 - ageDays / 183) * 30

      return {
        track: {
          id: video.id!.trim(),
          title: decodeYouTubeText(video.snippet!.title!).slice(0, 200),
          artist: decodeYouTubeText(video.snippet!.channelTitle!).slice(0, 120),
        },
        score: popularity + freshness,
        publishedAt: Number.isFinite(publishedAt) ? publishedAt : 0,
      }
    })
    .sort((left, right) => right.score - left.score || right.publishedAt - left.publishedAt)
    .flatMap(({ track }) => {
      if (seen.has(track.id)) return []
      seen.add(track.id)
      return [track]
    })

  for (const track of fallbackTracks) {
    if (ranked.length >= WEEKLY_PRAISE_LIMIT) break
    if (seen.has(track.id)) continue
    seen.add(track.id)
    ranked.push(track)
  }

  return ranked.slice(0, WEEKLY_PRAISE_LIMIT)
}

export async function getWeeklyPraiseTop50(apiKey: string, now = new Date()) {
  const curatedTracks = officialPraiseTracks.slice(0, 100)
  const curatedDetails = await fetchVideoDetails(curatedTracks.map((track) => track.id), apiKey)
  const officialChannelIds = Array.from(new Set(
    curatedDetails.map((video) => video.snippet?.channelId?.trim() ?? '').filter(Boolean)
  )).slice(0, 16)

  if (officialChannelIds.length === 0) {
    throw new Error('공식 찬양 채널을 확인하지 못했습니다.')
  }

  const recentIds = await fetchRecentChannelVideoIds(officialChannelIds, apiKey, now)
  const existingIds = new Set(curatedDetails.map((video) => video.id))
  const recentDetails = await fetchVideoDetails(
    recentIds.filter((id) => !existingIds.has(id)),
    apiKey,
  )

  const tracks = rankWeeklyPraiseCandidates(
    [...curatedDetails, ...recentDetails],
    curatedTracks,
    now,
  )
  if (tracks.length !== WEEKLY_PRAISE_LIMIT) {
    throw new Error(`TOP50 안전 기준을 충족하지 못했습니다: ${tracks.length}곡`)
  }
  return tracks
}
