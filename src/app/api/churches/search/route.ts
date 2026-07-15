import { NextRequest, NextResponse } from 'next/server'
import { searchChurches } from '@/lib/churchSearch'
import { getRequestUser } from '@/lib/requestUser'

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request)

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (query.length < 2 || query.length > 50) {
    return NextResponse.json(
      { error: '교회 이름이나 지역을 2자 이상 입력해주세요.' },
      { status: 400 }
    )
  }

  try {
    const churches = await searchChurches(query)

    return NextResponse.json(
      { churches },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('Church search failed:', error)

    return NextResponse.json(
      { error: '교회 검색에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 502 }
    )
  }
}
