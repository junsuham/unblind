import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: '관리자 권한이 없습니다.' },
      { status: 401 }
    )
  }

  const adminSessionToken = process.env.ADMIN_SESSION_TOKEN

  if (!adminSessionToken) {
    return NextResponse.json(
      { error: '관리자 세션 설정을 확인해주세요.' },
      { status: 503 }
    )
  }

  const response = NextResponse.redirect(new URL('/admin', request.url))

  response.cookies.set('admin_session', adminSessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })
  response.headers.set('Cache-Control', 'no-store')

  return response
}
