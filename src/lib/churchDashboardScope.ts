export type ChurchDashboardScope = {
  churchPlaceId: string
  churchName: string
  department: string | null
}

export const CHURCH_DASHBOARD_TARGET_PLACE_ID = 'way-465724410'
export const CHURCH_DASHBOARD_TARGET_DEPARTMENT = '2부'

export type ChurchDashboardGrantProfile = {
  complete: boolean
  hasChurchConsent: boolean
  referenceAge: number | null
  churchPlaceId: string | null
  churchDepartment: string | null
}

export const churchDashboardGrantBlockers = {
  account: '대상자가 먼저 Google 계정으로 로그인해야 합니다.',
  profile: '대상자의 가입 정보와 연령 확인이 완료되어야 합니다.',
  approval: '앱 승인과 이용 약속 동의를 먼저 완료해야 합니다.',
  church: '가입 정보에서 연세중앙교회 본당을 선택한 회원만 부여할 수 있습니다.',
  consent: '대상자가 내 정보 → 교회 정보 동의에서 직접 동의해야 합니다.',
  department: '가입 정보의 하위 부서가 2부와 다릅니다. 소속 정보를 먼저 확인해 주세요.',
} as const

export type ChurchDashboardGrantBlocker = keyof typeof churchDashboardGrantBlockers

export function getChurchDashboardGrantBlocker({
  isGoogleMember,
  profile,
  isApprovedAndAgreed,
}: {
  isGoogleMember: boolean
  profile: ChurchDashboardGrantProfile
  isApprovedAndAgreed: boolean
}): ChurchDashboardGrantBlocker | null {
  if (!isGoogleMember) return 'account'
  if (!profile.complete || profile.referenceAge === null ||
    profile.referenceAge < 20 || profile.referenceAge > 59) return 'profile'
  if (!isApprovedAndAgreed) return 'approval'
  if (profile.churchPlaceId !== CHURCH_DASHBOARD_TARGET_PLACE_ID) return 'church'
  if (!profile.hasChurchConsent) return 'consent'
  const department = normalizeChurchScopeName(profile.churchDepartment)
  if (department && department !== CHURCH_DASHBOARD_TARGET_DEPARTMENT) return 'department'
  return null
}

export function isChurchDashboardTarget(scope: Pick<ChurchDashboardScope, 'churchPlaceId' | 'department'>) {
  return scope.churchPlaceId === CHURCH_DASHBOARD_TARGET_PLACE_ID &&
    scope.department === CHURCH_DASHBOARD_TARGET_DEPARTMENT
}

export function normalizeChurchScopeName(value: string | null | undefined) {
  return (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR')
}

export function matchesChurchDashboardScope(
  granted: ChurchDashboardScope,
  profile: { churchPlaceId: string | null; department: string | null },
  adminVerifiedDepartment = false,
) {
  if (!granted.churchPlaceId.trim() || !profile.churchPlaceId?.trim()) return false
  if (granted.churchPlaceId.trim() !== profile.churchPlaceId.trim()) return false

  if (granted.department === null) return true
  if (adminVerifiedDepartment && !normalizeChurchScopeName(profile.department)) return true
  return normalizeChurchScopeName(granted.department) === normalizeChurchScopeName(profile.department)
}
