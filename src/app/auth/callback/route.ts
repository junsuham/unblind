import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (!code) {
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set(
      'error',
      '로그인 인증 코드가 없습니다. 새 로그인 링크를 요청해주세요.'
    )

    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)

    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set(
      'error',
      '로그인 링크가 만료되었거나 이미 사용되었습니다.'
    )

    return NextResponse.redirect(loginUrl)
  }

  const safeNext =
    next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/'

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
}
