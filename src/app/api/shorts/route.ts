import {
  getChristianShortsFeed,
  isSafeYouTubePageToken,
} from '@/lib/christianShorts'
import { getRequestUser } from '@/lib/requestUser'

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const pageToken = new URL(request.url).searchParams.get('pageToken')?.trim() ?? ''
  if (!pageToken || !isSafeYouTubePageToken(pageToken)) {
    return Response.json({ error: '잘못된 페이지 요청입니다.' }, { status: 400 })
  }

  const feed = await getChristianShortsFeed(pageToken)
  if (feed.status === 'unavailable') {
    return Response.json(
      { error: feed.message ?? '영상을 불러오지 못했습니다.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    )
  }

  return Response.json(
    {
      videos: feed.videos,
      nextPageToken: feed.nextPageToken ?? null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
