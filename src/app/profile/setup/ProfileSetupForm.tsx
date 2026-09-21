'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { occupationLabels, type Occupation } from '@/lib/profile'

type ChurchResult = { id: string; name: string; address: string; roadAddress: string; phone: string; placeUrl: string }
type Props = { nickname: string; referenceAge: number }
const steps = ['연령 확인', '정보 수집 동의', '교회 선택', '가입 요청'] as const
const cardClass = 'rounded-[var(--ub-radius-xl)] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-5 text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)] backdrop-blur-2xl'

function StepProgress({ current }: { current: number }) {
  return (
    <nav aria-label="가입 단계" className="rounded-[20px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card)] p-3 shadow-[var(--ub-shadow-card)] backdrop-blur-2xl">
      <ol className="grid grid-cols-4 gap-1">
        {steps.map((label, index) => {
          const number = index + 1
          const highlighted = current >= number
          return <li key={label} className="min-w-0 text-center">
            <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${highlighted ? 'bg-[var(--ub-color-brand)] text-white' : 'bg-[var(--ub-surface-pressed)] text-[var(--ub-text-tertiary)]'}`}>{current > number ? '✓' : number}</span>
            <span className={`mt-1.5 block truncate text-[11px] leading-[15px] ${current === number ? 'font-semibold text-[var(--ub-text-primary)]' : 'text-[var(--ub-text-tertiary)]'}`}>{label}</span>
          </li>
        })}
      </ol>
    </nav>
  )
}

export default function ProfileSetupForm({ nickname, referenceAge }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [consented, setConsented] = useState(false)
  const [churchQuery, setChurchQuery] = useState('')
  const [churchResults, setChurchResults] = useState<ChurchResult[]>([])
  const [selectedChurch, setSelectedChurch] = useState<ChurchResult | null>(null)
  const [churchDepartment, setChurchDepartment] = useState('')
  const [occupation, setOccupation] = useState<Occupation | ''>('')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function go(next: number) { setError(''); setStep(next) }

  async function searchForChurch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (churchQuery.trim().length < 2) return setError('교회 이름이나 지역을 2자 이상 입력해주세요.')
    setIsSearching(true); setError(''); setSelectedChurch(null)
    const response = await fetch(`/api/churches/search?q=${encodeURIComponent(churchQuery.trim())}`)
    const result = await response.json().catch(() => null)
    setIsSearching(false)
    if (!response.ok) { setChurchResults([]); return setError(result?.error ?? '교회를 검색하지 못했습니다.') }
    setChurchResults(result?.churches ?? [])
    if (!result?.churches?.length) setError('검색 결과가 없습니다. 지역명과 교회 이름을 함께 입력해보세요.')
  }

  function confirmChurch() {
    if (!selectedChurch) return setError('검색 결과에서 출석 교회를 선택해주세요.')
    if (!occupation) return setError('학생, 직장인, 기타 중 하나를 선택해주세요.')
    if (churchDepartment.trim().length > 80) return setError('하위 부서는 80자 이하로 입력해주세요.')
    go(4)
  }

  async function submitProfile() {
    if (!consented || !selectedChurch || !occupation) return setError('이전 단계의 필수 정보를 다시 확인해주세요.')
    setIsSubmitting(true); setError('')
    const response = await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        churchPlaceId: selectedChurch.id,
        churchName: selectedChurch.name,
        churchAddress: selectedChurch.roadAddress || selectedChurch.address,
        churchDepartment: churchDepartment.trim(), occupation,
        churchInfoConsentAccepted: true,
      }),
    })
    const result = await response.json().catch(() => null)
    setIsSubmitting(false)
    if (!response.ok) return setError(result?.error ?? '가입 요청을 저장하지 못했습니다.')
    router.push('/pending'); router.refresh()
  }

  return <div className="space-y-5">
    <StepProgress current={step} />

    {step === 1 && <section className={cardClass}>
      <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">1 · 연령 확인</p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px]">가입 가능한 연령이에요</h2>
      <div className="mt-5 rounded-[18px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 py-4">
        <span className="ios-caption text-[var(--ub-text-tertiary)]">Google 계정 연령 확인 완료</span>
        <p className="mt-1 text-[19px] font-semibold">2026년도 기준 {referenceAge}세</p>
      </div>
      <p className="mt-3 ios-secondary">직접 입력한 생년월일은 받지 않습니다. 확인 결과는 가입 심사에만 사용되며 다른 사용자에게 공개되지 않습니다.</p>
      <button type="button" onClick={() => go(2)} className="mt-6 min-h-[52px] w-full rounded-[16px] bg-[var(--ub-color-brand)] px-4 ios-title text-white">다음</button>
    </section>}

    {step === 2 && <section className={cardClass}>
      <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">2 · 정보 수집 동의</p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px]">교회 소속 정보 이용에 동의해주세요</h2>
      <p className="mt-3 ios-secondary">출석 교회와 하위 부서는 소속 확인과 안전한 공동체 운영을 위해서만 사용하며, 일반 사용자에게 공개하지 않습니다.</p>
      <div className="mt-5 rounded-[18px] border border-[var(--ub-separator)] bg-[var(--ub-surface-input)] p-4 ios-secondary text-[var(--ub-text-secondary)]">
        <p><strong className="text-[var(--ub-text-primary)]">수집 항목</strong> · 출석 교회, 교회 주소, 선택 입력한 하위 부서</p>
        <p className="mt-2"><strong className="text-[var(--ub-text-primary)]">이용 목적</strong> · 가입 확인, 중복·사칭 방지, 운영자 승인</p>
        <p className="mt-2"><strong className="text-[var(--ub-text-primary)]">보유 기간</strong> · 회원 탈퇴 또는 동의 철회 시까지</p>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] p-4">
        <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ub-color-brand)]" />
        <span className="ios-title">종교·교회 정보 수집 및 이용에 동의합니다. <span className="text-[var(--ub-color-brand)]">(필수)</span></span>
      </label>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => go(1)} className="min-h-[52px] flex-1 rounded-[16px] bg-[var(--ub-surface-pressed)] ios-title text-[var(--ub-text-secondary)]">이전</button>
        <button type="button" disabled={!consented} onClick={() => go(3)} className="min-h-[52px] flex-[2] rounded-[16px] bg-[var(--ub-color-brand)] ios-title text-white disabled:opacity-40">동의하고 다음</button>
      </div>
    </section>}

    {step === 3 && <section className={cardClass}>
      <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">3 · 교회 검색 및 선택</p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px]">출석 교회를 찾아주세요</h2>
      <p className="mt-2 ios-secondary">지도 장소 데이터에 등록된 실제 교회를 선택해주세요. 이름에서 ‘교회’는 생략해도 됩니다.</p>
      <form onSubmit={searchForChurch} className="mt-5 flex gap-2">
        <input aria-label="출석 교회 검색" value={churchQuery} onChange={(e) => setChurchQuery(e.target.value)} placeholder="예: 서초 사랑의교회" className="min-h-[50px] min-w-0 flex-1 rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 ios-body text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:border-[var(--ub-color-brand)]" />
        <button type="submit" disabled={isSearching} className="min-h-[50px] shrink-0 rounded-[16px] bg-[var(--ub-surface-pressed)] px-4 ios-title text-[var(--ub-color-brand)] disabled:opacity-50">{isSearching ? '검색 중' : '검색'}</button>
      </form>
      {churchResults.length > 0 && <div className="mt-4 max-h-[270px] overflow-y-auto rounded-[18px] border border-[var(--ub-separator)]">
        {churchResults.map((church) => {
          const selected = selectedChurch?.id === church.id
          return <button key={church.id} type="button" onClick={() => { setSelectedChurch(church); setError('') }} className={`block w-full border-b border-[var(--ub-separator)] px-4 py-3 text-left last:border-b-0 ${selected ? 'bg-[var(--ub-surface-brand-soft)]' : 'bg-[var(--ub-surface-input)]'}`}>
            <span className="block ios-title">{church.name}{selected ? ' · 선택됨' : ''}</span>
            <span className="mt-1 block ios-caption text-[var(--ub-text-secondary)]">{church.roadAddress || church.address}</span>
            {church.phone && <span className="mt-0.5 block ios-caption text-[var(--ub-text-tertiary)]">{church.phone}</span>}
          </button>
        })}
      </div>}
      {selectedChurch && <div className="mt-5">
        <label htmlFor="church-department" className="ios-title">하위 부서 <span className="font-normal text-[var(--ub-text-tertiary)]">(선택)</span></label>
        <p className="mt-1 ios-caption text-[var(--ub-text-tertiary)]">청년부·대학부·찬양팀·셀 이름처럼 소속을 구체적으로 적을 수 있어요.</p>
        <input id="church-department" value={churchDepartment} onChange={(e) => setChurchDepartment(e.target.value)} maxLength={80} placeholder="예: 청년부, 대학부, 다윗찬양팀" className="mt-3 min-h-[50px] w-full rounded-[16px] border border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] px-4 ios-body text-[var(--ub-text-primary)] outline-none placeholder:text-[var(--ub-text-tertiary)] focus:border-[var(--ub-color-brand)]" />
      </div>}
      <fieldset className="mt-6"><legend className="ios-title">현재 상태</legend><div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.entries(occupationLabels) as [Occupation, string][]).map(([value, label]) => <label key={value} className={`flex min-h-[50px] cursor-pointer items-center justify-center rounded-[15px] border ios-title ${occupation === value ? 'border-[var(--ub-color-brand)] bg-[var(--ub-surface-brand-soft)] text-[var(--ub-color-brand)]' : 'border-[var(--ub-control-border)] bg-[var(--ub-surface-input)] text-[var(--ub-text-secondary)]'}`}><input type="radio" name="occupation" value={value} checked={occupation === value} onChange={() => setOccupation(value)} className="sr-only" />{label}</label>)}
      </div></fieldset>
      {error && <div role="alert" className="mt-4 rounded-[18px] border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] p-4 ios-secondary text-[var(--ub-danger-text)]">{error}</div>}
      <div className="mt-6 flex gap-2"><button type="button" onClick={() => go(2)} className="min-h-[52px] flex-1 rounded-[16px] bg-[var(--ub-surface-pressed)] ios-title text-[var(--ub-text-secondary)]">이전</button><button type="button" onClick={confirmChurch} className="min-h-[52px] flex-[2] rounded-[16px] bg-[var(--ub-color-brand)] ios-title text-white">선택 완료</button></div>
    </section>}

    {step === 4 && selectedChurch && <section className={cardClass}>
      <p className="ios-caption font-semibold text-[var(--ub-color-brand)]">4 · 확인 대기 또는 가입 완료</p>
      <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.3px]">입력한 정보를 확인해주세요</h2>
      <div className="mt-5 overflow-hidden rounded-[18px] border border-[var(--ub-separator)] bg-[var(--ub-surface-input)]">
        <div className="border-b border-[var(--ub-separator)] px-4 py-3"><span className="ios-caption text-[var(--ub-text-tertiary)]">앱 아이디</span><p className="mt-1 ios-title">{nickname}</p></div>
        <div className="border-b border-[var(--ub-separator)] px-4 py-3"><span className="ios-caption text-[var(--ub-text-tertiary)]">출석 교회</span><p className="mt-1 ios-title">{selectedChurch.name}</p><p className="mt-1 ios-caption text-[var(--ub-text-secondary)]">{selectedChurch.roadAddress || selectedChurch.address}</p></div>
        <div className="border-b border-[var(--ub-separator)] px-4 py-3"><span className="ios-caption text-[var(--ub-text-tertiary)]">하위 부서</span><p className="mt-1 ios-title">{churchDepartment.trim() || '입력하지 않음'}</p></div>
        <div className="px-4 py-3"><span className="ios-caption text-[var(--ub-text-tertiary)]">현재 상태</span><p className="mt-1 ios-title">{occupation ? occupationLabels[occupation] : '-'}</p></div>
      </div>
      <p className="mt-4 ios-secondary">가입 요청 후 운영자가 교회 정보와 가입 조건을 확인합니다. 승인되면 별도의 재가입 없이 바로 이용할 수 있어요.</p>
      {error && <div role="alert" className="mt-4 rounded-[18px] border border-[var(--ub-danger-border)] bg-[var(--ub-danger-soft)] p-4 ios-secondary text-[var(--ub-danger-text)]">{error}</div>}
      <div className="mt-6 flex gap-2"><button type="button" onClick={() => go(3)} className="min-h-[52px] flex-1 rounded-[16px] bg-[var(--ub-surface-pressed)] ios-title text-[var(--ub-text-secondary)]">수정</button><button type="button" disabled={isSubmitting} onClick={submitProfile} className="min-h-[52px] flex-[2] rounded-[16px] bg-[var(--ub-color-brand)] ios-title text-white disabled:opacity-50">{isSubmitting ? '요청 중…' : '가입 승인 요청'}</button></div>
    </section>}
  </div>
}
