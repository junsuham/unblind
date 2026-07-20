'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type SocialProvider = Extract<Provider, 'google'>

const providerNames: Record<SocialProvider, string> = {
  google: 'Google',
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

export default function LoginPage() {
  const searchParams = useSearchParams()
  const requestedNext = searchParams.get('next')
  const safeNext =
    requestedNext?.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/'
  const [pendingProvider, setPendingProvider] =
    useState<SocialProvider | null>(null)
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') ?? ''
  )

  useEffect(() => {
    document.documentElement.classList.add('ub-login-active')
    return () => document.documentElement.classList.remove('ub-login-active')
  }, [])

  async function handleSocialLogin(provider: SocialProvider) {
    setPendingProvider(provider)
    setErrorMessage('')

    try {
      const siteUrl =
        window.location.hostname.endsWith('.vercel.app')
          ? 'https://unbd.vercel.app'
          : window.location.origin.replace(/\/$/, '')

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`,
          scopes: 'openid email profile',
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
    <main className="ub-login-hero relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#fc5230] px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-[calc(22px+env(safe-area-inset-top))] text-white">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-[22%] h-80 w-80 rounded-full border-[48px] border-black/5" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-[12%] h-72 w-72 rotate-12 rounded-[72px] border-[44px] border-black/5" />

      <div className="relative z-10 mx-auto flex w-full max-w-[430px] flex-1 flex-col">
        <div className="flex justify-center pt-[4vh]">
          <Image
            src="/brand/unblind-wordmark-glass.png"
            alt="UNBLIND"
            width={270}
            height={90}
            priority
            className="h-[90px] w-[270px] object-contain"
          />
        </div>

        <section className="flex flex-1 flex-col items-center justify-center pb-[7vh] text-center">
          <p className="text-[18px] font-semibold leading-[26px] tracking-[-0.02em] text-white/88">
            세상을 바꾸는 사랑의 목소리
          </p>
          <h1 className="mt-3 break-keep text-[36px] font-extrabold leading-[45px] tracking-[-0.045em] text-white sm:text-[40px] sm:leading-[50px]">
            기독교 익명 중보 커뮤니티
          </h1>
          <p className="mt-6 max-w-[340px] break-keep text-[13px] font-medium leading-[20px] text-white/76">
            내가 너희를 사랑한 것 같이 너희도 서로 사랑하라 -요15:2-
          </p>
        </section>

        <div className="relative z-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSocialLogin('google')}
            className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[17px] border border-white/60 bg-white px-5 text-[17px] font-bold text-[#191919] shadow-[0_12px_30px_rgba(92,24,0,0.2)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <GoogleIcon />
            {pendingProvider === 'google'
              ? '구글 연결 중...'
              : '구글로 회원가입'}
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="mt-3 rounded-[16px] border border-white/35 bg-black/16 p-4 text-[14px] leading-[20px] text-white">
            {errorMessage}
          </div>
        )}
      </div>
    </main>
  )
}
