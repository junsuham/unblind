import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminSessionToken = process.env.ADMIN_SESSION_TOKEN

  if (!adminPassword || !adminSessionToken) {
    return NextResponse.json(
      { error: 'Admin environment variables are missing.' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const password = body?.password

  if (!password || password !== adminPassword) {
    return NextResponse.json(
      { error: '관리자 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set('admin_session', adminSessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}
