'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AGREEMENT_VERSION } from '@/lib/agreement'
import { NoticeCard } from '@/app/components/ui/AppShell'

type AgreementFormProps = {
  alreadyAgreed?: boolean
}

const checks = [
  {
    id: 'privacy',
    title: '개인 특정 금지',
    description:
      '이름, 사역팀, 직책, 연락처, 구체적인 날짜와 장소처럼 누군가를 특정할 수 있는 정보를 적지 않겠습니다.',
    icon: 'person.crop.circle.badge.xmark',
  },
  {
    id: 'noAttack',
    title: '정죄와 공격 금지',
    description:
      '누군가를 정죄하거나 조롱하거나 공격하지 않고, 고민과 감정을 중심으로 나누겠습니다.',
    icon: 'heart.text.square',
  },
  {
    id: 'noCapture',
    title: '캡처와 외부 공유 금지',
    description:
      '이 공간의 글과 댓글을 캡처하거나 외부로 공유하지 않겠습니다.',
    icon: 'rectangle.on.rectangle.slash',
  },
  {
    id: 'noMisuse',
    title: '악용 금지',
    description:
      '이단/사이비 포교, 금전 요구, 성적 접근, 혐오 표현을 하지 않겠습니다.',
    icon: 'exclamationmark.shield',
  },
  {
    id: 'report',
    title: '위험한 내용 신고',
    description:
      '위험한 글이나 누군가를 해칠 수 있는 내용을 보면 신고하고 운영자의 조치에 협조하겠습니다.',
    icon: 'flag',
  },
  {
    id: 'anonymousLimit',
    title: '익명성 범위 이해',
    description:
      '다른 사용자에게는 익명이지만, 신고 처리와 안전한 운영을 위해 운영자가 최소한의 기록을 확인할 수 있음을 이해합니다.',
    icon: 'lock.shield',
  },
]

function AgreementIcon({ name }: { name: string }) {
  if (name === 'person.crop.circle.badge.xmark') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          fill="none"
          stroke="#ff4b00"
          strokeWidth="1.8"
        />
        <path
          d="M4.5 20c.9-3.5 3.6-5.2 7.5-5.2 1.2 0 2.3.2 3.2.5"
          fill="none"
          stroke="#ff4b00"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="m17 17 4 4m0-4-4 4"
          fill="none"
          stroke="#FF3B30"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (name === 'heart.text.square') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M5 5.5h14v13H5z"
          fill="none"
          stroke="#ff4b00"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8.4 11.2c0-1 .7-1.7 1.6-1.7.7 0 1.2.4 1.6 1 .4-.6.9-1 1.6-1 .9 0 1.6.7 1.6 1.7 0 1.7-2.4 3.3-3.2 3.8-.8-.5-3.2-2.1-3.2-3.8Z"
          fill="none"
          stroke="#FF2D55"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (name === 'rectangle.on.rectangle.slash') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M8 8h11v9H8z"
          fill="none"
          stroke="#ff4b00"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M5 15V5h11"
          fill="none"
          stroke="#ff4b00"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="m4 4 16 16"
          fill="none"
          stroke="#FF3B30"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (name === 'exclamationmark.shield') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 3.5 19 6v5.4c0 4.2-2.6 7.2-7 9.1-4.4-1.9-7-4.9-7-9.1V6l7-2.5Z"
          fill="none"
          stroke="#FF9500"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12 8v5"
          stroke="#FF9500"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M12 16.3v.1"
          stroke="#FF9500"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (name === 'flag') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M6 20V4"
          stroke="#ff4b00"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M6 5h11l-1.8 4L17 13H6"
          fill="none"
          stroke="#ff4b00"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        fill="none"
        stroke="#ff4b00"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 10h12v10H6z"
        fill="none"
        stroke="#ff4b00"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 14v2"
        stroke="#ff4b00"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckAccessory({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        checked
          ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff4b00] text-white'
          : 'h-6 w-6 shrink-0 rounded-full border border-[#C7C7CC] bg-white'
      }
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M3 7.1 5.6 9.7 11 4.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

export default function AgreementForm({
  alreadyAgreed = false,
}: AgreementFormProps) {
  const router = useRouter()

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    alreadyAgreed
      ? Object.fromEntries(checks.map((item) => [item.id, true]))
      : {}
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const allChecked = checks.every((item) => checkedItems[item.id])

  function toggleCheck(id: string) {
    if (alreadyAgreed) {
      return
    }

    setCheckedItems((previous) => ({
      ...previous,
      [id]: !previous[id],
    }))
  }

  async function handleAgree() {
    setErrorMessage('')

    if (alreadyAgreed) {
      return
    }

    if (!allChecked) {
      setErrorMessage('모든 약속에 동의해야 입장할 수 있습니다.')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.rpc('mark_beta_agreement', {
      p_agreement_version: AGREEMENT_VERSION,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-white/78">
          커뮤니티 약속
        </p>

        <div className="overflow-hidden rounded-[22px] bg-white shadow-sm">
          {checks.map((item) => (
            <label
              key={item.id}
              className="flex min-h-[76px] cursor-pointer items-center gap-3 border-b border-[#D1D1D6]/70 px-4 py-3 last:border-b-0 active:bg-[#E5E5EA]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F2F2F7]">
                <AgreementIcon name={item.icon} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[17px] leading-[22px] text-black">
                  {item.title}
                </p>

                <p className="mt-0.5 text-[15px] leading-[20px] text-[#3C3C43]/60">
                  {item.description}
                </p>
              </div>

              <CheckAccessory checked={!!checkedItems[item.id]} />

              <input
                type="checkbox"
                checked={!!checkedItems[item.id]}
                onChange={() => toggleCheck(item.id)}
                disabled={alreadyAgreed}
                className="sr-only"
              />
            </label>
          ))}
        </div>

        <p className="mt-2 px-4 text-[13px] leading-[18px] text-white/78">
          모든 항목에 동의해야 언블라인드 베타 공간에 입장할 수 있습니다.
        </p>
      </section>

      <NoticeCard title="익명성 안내" tone="warning">
        <p>
          다른 사용자에게는 이름과 이메일이 공개되지 않습니다. 단, 신고
          처리와 안전한 운영을 위해 운영자는 필요한 범위에서 계정 정보와
          작성 기록을 확인할 수 있습니다.
        </p>
      </NoticeCard>

      <NoticeCard title="베타 운영 안내">
        <p>
          이 공간은 청년회 내부 테스트 공간입니다. 운영 기준은 베타 기간
          동안 조정될 수 있으며, 위험한 글은 운영자가 숨김 또는 삭제 처리할
          수 있습니다.
        </p>
      </NoticeCard>

      {errorMessage && (
        <NoticeCard title="입장할 수 없습니다" tone="danger">
          <p>{errorMessage}</p>
        </NoticeCard>
      )}

      {!alreadyAgreed && (
        <div className="sticky bottom-[calc(18px+env(safe-area-inset-bottom))] z-30 rounded-[24px] border border-white/70 bg-white/72 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.16)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={handleAgree}
            disabled={isSubmitting || !allChecked}
            className="flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[#ff4b00] px-5 text-[17px] font-semibold text-white shadow-sm active:scale-[0.99] disabled:bg-[#8E8E93]"
          >
            {isSubmitting ? '입장 준비 중...' : '약속에 동의하고 입장하기'}
          </button>
        </div>
      )}
    </div>
  )
}
