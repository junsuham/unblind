import { NextResponse } from 'next/server'
import { isSafeMutationRequest, secretsEqual } from '@/lib/security'

const attempts = new Map<string, { count: number; resetAt: number }>()

function getClientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function isLocked(key: string) {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 })
    return false
  }
  current.count += 1
  return current.count > 5
}

export async function POST(request: Request) {
  if (!isSafeMutationRequest(request)) {
    return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 })
  }

  const clientKey = getClientKey(request)
  if (isLocked(clientKey)) {
    return NextResponse.json(
      { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    )
  }

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

  if (!secretsEqual(password, adminPassword)) {
    return NextResponse.json(
      { error: '관리자 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  attempts.delete(clientKey)

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
