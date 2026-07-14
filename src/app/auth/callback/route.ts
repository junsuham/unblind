import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabaseServer'

const emailOtpTypes = new Set<EmailOtpType>([
  'email',
  'email_change',
  'invite',
  'magiclink',
  'recovery',
  'signup',
])

function getLoginUrl(requestUrl: URL, message: string) {
  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', message)

  return loginUrl
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const authError = requestUrl.searchParams.get('error')
  const authErrorCode = requestUrl.searchParams.get('error_code')
  const next = requestUrl.searchParams.get('next') ?? '/profile/setup'

  if (authError) {
    return NextResponse.redirect(
      getLoginUrl(
        requestUrl,
        authError === 'access_denied'
          ? '소셜 로그인이 취소되었습니다.'
          : `소셜 로그인을 완료하지 못했습니다. 진단 코드: ${authErrorCode ?? authError}`
      )
    )
  }

  if (!code && !(tokenHash && type && emailOtpTypes.has(type))) {
    return NextResponse.redirect(
      getLoginUrl(
        requestUrl,
        '로그인 인증 정보가 올바르지 않습니다. 새 로그인 링크를 요청해주세요.'
      )
    )
  }

  try {
    const supabase = await createServerSupabase()
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash!,
          type: type as EmailOtpType,
        })

    if (error) {
      console.error('Auth callback error:', {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
      })

      return NextResponse.redirect(
        getLoginUrl(
          requestUrl,
          code
            ? '소셜 로그인 인증 세션이 만료되었습니다. 다시 로그인해주세요.'
            : '로그인 링크가 만료되었거나 이미 사용되었습니다.'
        )
      )
    }

    const safeNext =
      next.startsWith('/') && !next.startsWith('//')
        ? next
        : '/'

    return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
  } catch (error) {
    console.error('Unexpected auth callback error:', error)

    return NextResponse.redirect(
      getLoginUrl(
        requestUrl,
        '로그인 처리 중 오류가 발생했습니다. 잠시 후 새 링크를 요청해주세요.'
      )
    )
  }
}
