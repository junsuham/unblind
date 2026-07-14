'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getReferenceAge,
  isEligibleReferenceAge,
  occupationLabels,
  PROFILE_REFERENCE_YEAR,
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
}

export default function ProfileSetupForm({ nickname }: ProfileSetupFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'age' | 'details'>('age')
  const [birthDate, setBirthDate] = useState('')
  const [showAgeRestriction, setShowAgeRestriction] = useState(false)
  const [churchQuery, setChurchQuery] = useState('')
  const [churchResults, setChurchResults] = useState<ChurchResult[]>([])
  const [selectedChurch, setSelectedChurch] = useState<ChurchResult | null>(
    null
  )
  const [occupation, setOccupation] = useState<Occupation | ''>('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  function continueAfterAgeCheck() {
    const age = getReferenceAge(birthDate)

    if (!isEligibleReferenceAge(age)) {
      setShowAgeRestriction(true)
      return
    }

    setErrorMessage('')
    setStep('details')
  }

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
        birthDate,
        churchPlaceId: selectedChurch.id,
        churchName: selectedChurch.name,
        churchAddress: selectedChurch.roadAddress || selectedChurch.address,
        occupation,
      }),
    })
    const result = await response.json().catch(() => null)

    setIsSubmitting(false)

    if (!response.ok) {
      if (result?.code === 'AGE_RESTRICTED') {
        setStep('age')
        setShowAgeRestriction(true)
        return
      }

      setErrorMessage(result?.error ?? '프로필을 저장하지 못했습니다.')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2 px-1">
        <span
          className={`h-1.5 flex-1 rounded-full ${
            step === 'age'
              ? 'bg-[var(--ub-color-brand)]'
              : 'bg-[var(--ub-surface-card-strong)]'
          }`}
        />
        <span
          className={`h-1.5 flex-1 rounded-full ${
            step === 'details'
              ? 'bg-[var(--ub-color-brand)]'
              : 'bg-[var(--ub-surface-card-strong)]'
          }`}
        />
      </div>

      {step === 'age' ? (
        <section className="rounded-[var(--ub-radius-xl)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl">
          <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">
            1단계 · 연령 확인
          </p>
          <h2 className="mt-2 ios-title">생년월일을 입력해주세요</h2>
          <p className="mt-2 ios-secondary">
            {PROFILE_REFERENCE_YEAR}년도 기준 20세 이상 59세 이하만 가입할 수 있습니다.
          </p>

          <label
            htmlFor="birth-date"
            className="mt-6 mb-2 block ios-caption font-semibold text-[var(--ub-text-tertiary)]"
          >
            생년월일
          </label>
          <input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="min-h-[52px] w-full rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 ios-body text-[var(--ub-text-primary)] outline-none focus:border-[var(--ub-color-brand)]"
          />

          <button
            type="button"
            onClick={continueAfterAgeCheck}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[16px] bg-[var(--ub-color-brand)] px-5 ios-title text-white active:scale-[0.99]"
          >
            연령 확인하고 계속하기
          </button>
        </section>
      ) : (
        <div className="space-y-5">
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
              2단계 · 기본 정보
            </p>
            <h2 className="mt-2 ios-title">출석 교회를 검색해주세요</h2>
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

            <p className="mt-3 ios-caption text-[var(--ub-text-tertiary)]">
              장소 데이터 ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                OpenStreetMap contributors
              </a>
            </p>

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

            <div className="mt-6 grid grid-cols-[0.7fr_1.3fr] gap-2">
              <button
                type="button"
                onClick={() => setStep('age')}
                className="min-h-[52px] rounded-[16px] bg-[var(--ub-surface-pressed)] px-4 ios-title text-[var(--ub-text-secondary)]"
              >
                이전
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitProfile}
                className="min-h-[52px] rounded-[16px] bg-[var(--ub-color-brand)] px-4 ios-title text-white active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : '정보 저장하고 승인 요청'}
              </button>
            </div>
          </section>
        </div>
      )}

      {showAgeRestriction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-restriction-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-[360px] rounded-[28px] bg-[var(--ub-surface-card-strong)] p-6 text-center text-[var(--ub-text-primary)] shadow-2xl">
            <p className="text-[30px]" aria-hidden="true">⛔</p>
            <h2 id="age-restriction-title" className="mt-3 ios-title">
              가입 대상 연령이 아닙니다
            </h2>
            <p className="mt-3 ios-secondary">
              2026년도 기준 19세 이하 또는 60세 이상은 가입할 수 없습니다.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setShowAgeRestriction(false)}
              className="mt-6 min-h-[50px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-5 ios-title text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
