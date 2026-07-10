'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  AppShell,
  GlassCard,
  NoticeCard,
  PageHeader,
  Pill,
} from '@/app/components/ui/AppShell'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setMessage('')
    setErrorMessage('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail.includes('@')) {
      setErrorMessage('이메일을 정확히 입력해주세요.')
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setMessage('로그인 링크를 이메일로 보냈습니다. 메일함을 확인해주세요.')
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드 Beta"
        title="안전하게 입장하기"
        description="승인된 청년회 구성원만 입장할 수 있습니다. 등록된 이메일로 로그인 링크를 받아 접속해주세요."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Pill>승인제</Pill>
        <Pill>사용자 간 익명</Pill>
        <Pill>운영자 관리</Pill>
      </div>

      <GlassCard>
        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-[15px] font-semibold text-black">
            이메일
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="min-h-[52px] w-full rounded-[14px] border border-[#D1D1D6] bg-[#F2F2F7] px-4 text-[17px] text-black outline-none focus:border-[#ff4b00]"
          />

          {message && (
            <div className="mt-4 rounded-[16px] border border-green-200 bg-green-50 p-4 text-[15px] leading-[21px] text-green-700">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-[16px] border border-red-200 bg-red-50 p-4 text-[15px] leading-[21px] text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 text-[17px] font-semibold text-white shadow-sm active:scale-[0.99] disabled:bg-[#8E8E93]"
          >
            {isSubmitting ? '발송 중...' : '로그인 링크 받기'}
          </button>
        </form>
      </GlassCard>

      <div className="mt-5 space-y-3">
        <NoticeCard title="익명성 안내">
          <p>
            다른 사용자에게는 이름과 이메일이 공개되지 않습니다. 단, 신고
            처리와 안전한 운영을 위해 운영자는 필요한 범위에서 기록을
            확인할 수 있습니다.
          </p>
        </NoticeCard>

        <NoticeCard title="접속 안내" tone="warning">
          <p>
            로그인 링크를 눌렀는데 접속이 안 되면 운영자에게 이메일 등록
            여부를 확인해주세요.
          </p>
        </NoticeCard>
      </div>
    </AppShell>
  )
}
