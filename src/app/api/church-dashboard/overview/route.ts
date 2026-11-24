import { getChurchDashboardAccess } from '@/lib/churchDashboardAccess'
import { readChurchDashboardSnapshot } from '@/lib/churchDashboardData'
import { getRequestUser } from '@/lib/requestUser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  const access = await getChurchDashboardAccess(user)
  if (!access) {
    return Response.json({ error: '접근 권한이 없습니다.' }, {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  const result = await readChurchDashboardSnapshot(access)
  if (result.error) {
    return Response.json({ error: '운영 자료를 불러오지 못했습니다.' }, {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  return Response.json({ snapshot: result.snapshot }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
