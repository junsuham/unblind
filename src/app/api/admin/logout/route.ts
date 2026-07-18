import { NextResponse } from 'next/server'
import { isSafeMutationRequest } from '@/lib/security'

export async function POST(request: Request) {
  if (!isSafeMutationRequest(request)) {
    return NextResponse.json({ error: '요청 출처를 확인하지 못했습니다.' }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set('admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
