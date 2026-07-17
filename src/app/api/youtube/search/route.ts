import { NextRequest } from 'next/server'
import { getRequestUser } from '@/lib/requestUser'
import { consumeRequestRateLimit } from '@/lib/rateLimit'

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string }
    snippet?: { title?: string; channelTitle?: string }
  }>
  error?: { message?: string }
}

function decodeYouTubeText(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request)
  if (!user) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    bucket: 'search.youtube',
    identity: `user:${user.id}`,
    limit: 15,
    windowSeconds: 60,
  })
  if (!rateLimit.allowed) {
    return Response.json(
      { error: rateLimit.unavailable ? '검색 보호 기능을 사용할 수 없습니다.' : '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: rateLimit.unavailable ? 503 : 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    )
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2 || query.length > 60) {
    return Response.json({ error: '찬양 이름을 2자 이상 입력해주세요.' }, { status: 400 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'YouTube 검색 연결을 준비 중입니다.' }, { status: 503 })
  }

  const searchQuery = /찬양|ccm|worship/i.test(query) ? query : `${query} 찬양`
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('q', searchQuery)
  url.searchParams.set('maxResults', '10')
  url.searchParams.set('regionCode', 'KR')
  url.searchParams.set('relevanceLanguage', 'ko')
  url.searchParams.set('safeSearch', 'strict')
  url.searchParams.set('videoEmbeddable', 'true')
  url.searchParams.set('videoSyndicated', 'true')

  try {
    const response = await fetch(url, { cache: 'no-store' })
    const payload = (await response.json()) as YouTubeSearchResponse

    if (!response.ok) throw new Error(payload.error?.message ?? 'YouTube 검색 요청에 실패했습니다.')

    const videos = (payload.items ?? []).flatMap((item) => {
      const youtubeId = item.id?.videoId
      const title = item.snippet?.title
      if (!youtubeId || !title) return []
      return [{ youtubeId, title: decodeYouTubeText(title), channelTitle: decodeYouTubeText(item.snippet?.channelTitle ?? 'YouTube') }]
    })

    return Response.json({ videos }, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch (error) {
    console.error('YouTube search failed:', error)
    return Response.json({ error: 'YouTube 찬양 검색에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 })
  }
}
