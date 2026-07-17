import { NextResponse } from 'next/server'
import { clearRequestRateLimit, consumeRequestRateLimit } from '@/lib/rateLimit'
import { isSafeMutationRequest, secretsEqual } from '@/lib/security'

const LOGIN_RATE_LIMIT_BUCKET = 'admin.login'

export async function POST(request: Request) {
  if (!isSafeMutationRequest(request)) {
    return NextResponse.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 })
  }

  const rateLimit = await consumeRequestRateLimit(request, {
    bucket: LOGIN_RATE_LIMIT_BUCKET,
    limit: 5,
    windowSeconds: 15 * 60,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.unavailable ? '로그인 보안 확인을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.' : '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: rateLimit.unavailable ? 503 : 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
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

  await clearRequestRateLimit(LOGIN_RATE_LIMIT_BUCKET, rateLimit.keyHash)

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
