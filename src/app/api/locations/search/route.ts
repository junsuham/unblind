import { NextRequest } from 'next/server'
import { getRequestUser } from '@/lib/requestUser'
import { searchLocations } from '@/lib/locationSearch'

export async function GET(request: NextRequest) {
  if (!(await getRequestUser(request))) {
    return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (query.length < 2 || query.length > 60) {
    return Response.json({ error: '지역이나 장소 이름을 2자 이상 입력해주세요.' }, { status: 400 })
  }

  try {
    const locations = await searchLocations(query)
    return Response.json({ locations }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Location search failed:', error)
    return Response.json({ error: '지역 검색에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 502 })
  }
}
