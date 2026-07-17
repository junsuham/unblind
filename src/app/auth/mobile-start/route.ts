import { NextResponse, type NextRequest } from 'next/server'
import {
  getSafeMobileAuthRedirect,
  MOBILE_AUTH_REDIRECT_COOKIE,
} from '@/lib/mobileAuthRedirect'

function getSupabaseAuthHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
  } catch {
    return null
  }
}

export function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const returnTo = getSafeMobileAuthRedirect(
    requestUrl.searchParams.get('return_to')
  )
  const authUrlValue = requestUrl.searchParams.get('auth_url')

  if (!returnTo || !authUrlValue) {
    return new NextResponse('모바일 로그인 주소가 올바르지 않습니다.', {
      status: 400,
    })
  }

  let authUrl: URL

  try {
    authUrl = new URL(authUrlValue)
  } catch {
    return new NextResponse('인증 주소가 올바르지 않습니다.', { status: 400 })
  }

  const expectedCallback = new URL('/auth/callback', requestUrl.origin).toString()
  const supabaseAuthHost = getSupabaseAuthHost()

  if (!supabaseAuthHost) {
    return new NextResponse('인증 서버 설정을 확인할 수 없습니다.', {
      status: 503,
    })
  }

  const isSafeAuthUrl =
    authUrl.protocol === 'https:' &&
    authUrl.hostname === supabaseAuthHost &&
    authUrl.pathname === '/auth/v1/authorize' &&
    authUrl.searchParams.get('redirect_to') === expectedCallback

  if (!isSafeAuthUrl) {
    return new NextResponse('허용되지 않은 인증 주소입니다.', { status: 400 })
  }

  const response = NextResponse.redirect(authUrl)
  response.cookies.set({
    name: MOBILE_AUTH_REDIRECT_COOKIE,
    value: returnTo.toString(),
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/auth/callback',
  })

  return response
}
