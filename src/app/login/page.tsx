'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  AppShell,
  GlassCard,
  NoticeCard,
  PageHeader,
  Pill,
} from '@/app/components/ui/AppShell'

type SocialProvider = Extract<Provider, 'google' | 'kakao'>

const providerNames: Record<SocialProvider, string> = {
  google: 'Google',
  kakao: 'Kakao',
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.6-4.1H3v2.9A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.7a6 6 0 0 1 0-3.8V7H3a10 10 0 0 0 0 9.1l3.4-2.4Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.8c1.6 0 3 .5 4.1 1.6l3.1-3A10 10 0 0 0 3 7l3.4 2.9A5.9 5.9 0 0 1 12 5.8Z"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path
        fill="#191919"
        d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.8 5.2 4.6 6.6l-1.2 4.1c-.1.4.3.7.6.5l4.8-3.2h1.2c5.5 0 10-3.5 10-7.9S17.5 3 12 3Z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const requestedNext = searchParams.get('next')
  const safeNext =
    requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/profile/setup'
  const [pendingProvider, setPendingProvider] =
    useState<SocialProvider | null>(null)
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') ?? ''
  )

  async function handleSocialLogin(provider: SocialProvider) {
    setPendingProvider(provider)
    setErrorMessage('')

    try {
      const siteUrl = (
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      ).replace(/\/$/, '')

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          scopes:
            provider === 'google'
              ? 'openid email profile https://www.googleapis.com/auth/user.birthday.read'
              : 'profile_nickname account_email age_range birthday birthyear',
        },
      })

      if (error) {
        setErrorMessage(
          `${providerNames[provider]} 로그인을 시작하지 못했습니다. Supabase에서 해당 로그인 제공자가 활성화되어 있는지 확인해주세요.`
        )
        setPendingProvider(null)
      }
    } catch {
      setErrorMessage(
        `${providerNames[provider]} 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`
      )
      setPendingProvider(null)
    }
  }

  const isSubmitting = pendingProvider !== null

  return (
    <AppShell>
      <PageHeader
        eyebrow="청년회 내부 베타"
        title="소셜 계정으로 시작하기"
        description="Google 또는 Kakao 계정으로 간편하게 가입하고 로그인할 수 있습니다. 승인된 청년회 구성원만 입장할 수 있습니다."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>승인제</Pill>
        <Pill>사용자 간 익명</Pill>
        <Pill>운영자 관리</Pill>
      </div>

      <GlassCard>
        <div className="space-y-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSocialLogin('google')}
            className="ub-provider-google flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[16px] border px-5 text-[17px] font-semibold shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <GoogleIcon />
            {pendingProvider === 'google'
              ? 'Google 연결 중...'
              : 'Google로 계속하기'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSocialLogin('kakao')}
            className="ub-provider-kakao flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[16px] px-5 text-[17px] font-semibold shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <KakaoIcon />
            {pendingProvider === 'kakao'
              ? 'Kakao 연결 중...'
              : 'Kakao로 계속하기'}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-[18px] border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] p-4 text-[15px] leading-[21px] text-[var(--ub-danger-text)]">
            {errorMessage}
          </div>
        )}

        <p className="mt-4 text-center text-[13px] leading-[19px] text-[var(--ub-text-secondary)]">
          소셜 인증 후 연령 확인과 기본 정보 입력을 진행합니다. 소셜 계정의
          이메일은 운영자 승인 확인에만 사용됩니다.
        </p>
      </GlassCard>

      <div className="mt-5 space-y-3">
        <NoticeCard title="승인 이메일 안내" tone="warning">
          <p>
            Google 또는 Kakao 계정에 등록된 이메일이 승인 목록의 이메일과
            같아야 합니다. 이메일이 다르면 운영자에게 소셜 계정 이메일을
            알려주세요.
          </p>
        </NoticeCard>

        <NoticeCard title="익명성 안내">
          <p>
            다른 사용자에게는 소셜 계정 정보와 이메일이 공개되지 않습니다.
            신고 처리와 안전한 운영을 위해 운영자는 필요한 범위에서 기록을
            확인할 수 있습니다.
          </p>
        </NoticeCard>
      </div>
    </AppShell>
  )
}
