'use client'

import {
  AppShell,
  GlassCard,
  PageHeader,
} from '@/app/components/ui/AppShell'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <AppShell>
      <PageHeader
        eyebrow="언블라인드"
        title="문제가 생겼어요"
        description="일시적인 오류일 수 있습니다. 다시 시도해보세요."
      />

      <GlassCard>
        <p className="text-[17px] leading-[25px] text-black">
          화면을 불러오는 중 문제가 발생했습니다.
        </p>

        <p className="mt-3 break-words text-[15px] leading-[21px] text-[#3C3C43]/60">
          {error.message}
        </p>
      </GlassCard>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={reset}
          className="flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 text-[17px] font-semibold text-white shadow-sm active:scale-[0.99]"
        >
          다시 시도하기
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
          className="flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#E5E5EA] px-5 text-[17px] font-semibold text-[#ff4b00] active:scale-[0.99]"
        >
          홈으로 이동
        </button>
      </div>
    </AppShell>
  )
}
