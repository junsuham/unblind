'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  occupationLabels,
  type Occupation,
} from '@/lib/profile'

type ChurchResult = {
  id: string
  name: string
  address: string
  roadAddress: string
  phone: string
  placeUrl: string
}

type ProfileSetupFormProps = {
  nickname: string
  referenceAge: number
}

const onboardingGuides = [
  {
    id: 'privacy',
    title: '개인정보와 익명성',
    description: '연령 확인 결과·이메일·출석교회·현재 상태는 가입 확인과 안전한 운영에만 사용되며 다른 사용자에게 공개되지 않습니다.',
  },
  {
    id: 'community',
    title: '서로를 살리는 나눔',
    description: '실명이나 개인을 특정할 정보, 공격·정죄·혐오 표현을 올리지 않고 고민과 기도 제목을 중심으로 나눕니다.',
  },
  {
    id: 'sharing',
    title: '외부 공유와 운영 기준',
    description: '게시글과 댓글을 외부에 공유하지 않으며, 신고 처리와 공동체 보호를 위한 운영자의 최소한의 확인에 동의합니다.',
  },
] as const

export default function ProfileSetupForm({
  nickname,
  referenceAge,
}: ProfileSetupFormProps) {
  const router = useRouter()
  const [churchQuery, setChurchQuery] = useState('')
  const [churchResults, setChurchResults] = useState<ChurchResult[]>([])
  const [selectedChurch, setSelectedChurch] = useState<ChurchResult | null>(null)
  const [occupation, setOccupation] = useState<Occupation | ''>('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmedGuides, setConfirmedGuides] = useState<Record<string, boolean>>({})
  const allGuidesConfirmed = onboardingGuides.every(
    (guide) => confirmedGuides[guide.id]
  )

  async function searchForChurch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (churchQuery.trim().length < 2) {
      setErrorMessage('교회 이름이나 지역을 2자 이상 입력해주세요.')
      return
    }

    setIsSearching(true)
    setErrorMessage('')
    setSelectedChurch(null)

    const response = await fetch(
      `/api/churches/search?q=${encodeURIComponent(churchQuery.trim())}`
    )
    const result = await response.json().catch(() => null)

    setIsSearching(false)

    if (!response.ok) {
      setChurchResults([])
      setErrorMessage(result?.error ?? '교회를 검색하지 못했습니다.')
      return
    }

    setChurchResults(result?.churches ?? [])

    if (!result?.churches?.length) {
      setErrorMessage('검색 결과가 없습니다. 지역명과 교회 이름을 함께 입력해보세요.')
    }
  }

  async function submitProfile() {
    if (!allGuidesConfirmed) {
      setErrorMessage('앱 이용 안내와 개인정보 처리 내용을 모두 확인해주세요.')
      return
    }

    if (!selectedChurch) {
      setErrorMessage('검색 결과에서 출석 교회를 선택해주세요.')
      return
    }

    if (!occupation) {
      setErrorMessage('학생, 직장인, 기타 중 하나를 선택해주세요.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        churchPlaceId: selectedChurch.id,
        churchName: selectedChurch.name,
        churchAddress: selectedChurch.roadAddress || selectedChurch.address,
        occupation,
        agreementAccepted: true,
      }),
    })
    const result = await response.json().catch(() => null)

    setIsSubmitting(false)

    if (!response.ok) {
      setErrorMessage(result?.error ?? '프로필을 저장하지 못했습니다.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--ub-radius-xl)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl">
        <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">
          앱 안내사항
        </p>
        <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.2px]">
          안전한 익명 공동체를 함께 만들어주세요
        </h2>

        <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--ub-separator)]">
          {onboardingGuides.map((guide) => {
            const checked = !!confirmedGuides[guide.id]

            return (
              <label
                key={guide.id}
                className="flex cursor-pointer items-start gap-3 border-b border-[var(--ub-separator)] bg-[var(--ub-surface-input)] px-4 py-4 last:border-b-0 active:bg-[var(--ub-surface-pressed)]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setConfirmedGuides((current) => ({
                      ...current,
                      [guide.id]: !current[guide.id],
                    }))
                    setErrorMessage('')
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ub-color-brand)]"
                />
                <span className="min-w-0">
                  <span className="block ios-title">{guide.title}</span>
                  <span className="mt-1 block ios-secondary">
                    {guide.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="rounded-[var(--ub-radius-xl)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl">
        <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">
          자동 생성 아이디
        </p>
        <p className="mt-2 text-[22px] font-semibold tracking-[-0.3px]">
          {nickname}
        </p>
        <p className="mt-2 ios-secondary">
          안전한 익명 활동을 위해 성경 인물과 알파벳을 조합했습니다. 다른 사용자에게는 이 아이디만 표시됩니다.
        </p>
      </section>

      <section className="rounded-[var(--ub-radius-xl)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl">
        <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">
          기본 정보
        </p>

        <div className="mt-4 rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 py-3">
          <span className="ios-caption text-[var(--ub-text-tertiary)]">Google 계정 연령 확인 완료</span>
          <p className="mt-1 ios-title">2026년도 기준 {referenceAge}세</p>
        </div>
        <p className="mt-2 ios-secondary">
          직접 입력한 생년월일은 받지 않습니다. 확인된 연령 정보는 가입 심사에만 사용되며 다른 사용자에게 공개되지 않습니다.
        </p>

        <h2 className="mt-6 ios-title">출석 교회를 검색해주세요</h2>
        <p className="mt-2 ios-secondary">
          지도 장소 데이터에 등록된 실제 교회 중 하나를 선택해야 합니다. 이름에서 ‘교회’는 생략해도 됩니다.
        </p>

        <form onSubmit={searchForChurch} className="mt-5 flex gap-2">
          <input
            value={churchQuery}
            onChange={(event) => setChurchQuery(event.target.value)}
            placeholder="예: 서초 사랑의교회"
            className="min-h-[50px] min-w-0 flex-1 rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 ios-body text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:border-[var(--ub-color-brand)]"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="min-h-[50px] shrink-0 rounded-[16px] bg-[var(--ub-surface-pressed)] px-4 ios-title text-[var(--ub-color-brand)] disabled:opacity-50"
          >
            {isSearching ? '검색 중' : '검색'}
          </button>
        </form>

        {churchResults.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-[18px] border border-[var(--ub-separator)]">
            {churchResults.map((church) => {
              const isSelected = selectedChurch?.id === church.id

              return (
                <button
                  key={church.id}
                  type="button"
                  onClick={() => {
                    setSelectedChurch(church)
                    setErrorMessage('')
                  }}
                  className={`block w-full border-b border-[var(--ub-separator)] px-4 py-3 text-left last:border-b-0 ${
                    isSelected
                      ? 'bg-[var(--ub-surface-brand-soft)]'
                      : 'bg-[var(--ub-surface-input)]'
                  }`}
                >
                  <span className="block ios-title">{church.name}</span>
                  <span className="mt-1 block ios-caption text-[var(--ub-text-secondary)]">
                    {church.roadAddress || church.address}
                  </span>
                  {church.phone && (
                    <span className="mt-0.5 block ios-caption text-[var(--ub-text-tertiary)]">
                      {church.phone}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <fieldset className="mt-6">
          <legend className="ios-title">현재 상태</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.entries(occupationLabels) as [Occupation, string][]).map(
              ([value, label]) => (
                <label
                  key={value}
                  className={`flex min-h-[50px] cursor-pointer items-center justify-center rounded-[15px] border ios-title ${
                    occupation === value
                      ? 'border-[var(--ub-color-brand)] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]'
                      : 'border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] text-[var(--ub-text-secondary)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={value}
                    checked={occupation === value}
                    onChange={() => setOccupation(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              )
            )}
          </div>
        </fieldset>

        {errorMessage && (
          <div className="mt-4 rounded-[18px] border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] p-4 ios-secondary text-[var(--ub-danger-text)]">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={submitProfile}
          className="mt-6 min-h-[52px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-4 ios-title text-white active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? '저장 중…' : '정보 저장하고 승인 요청'}
        </button>
      </section>
    </div>
  )
}
