export type ChurchDashboardScope = {
  churchPlaceId: string
  churchName: string
  department: string | null
}

export const CHURCH_DASHBOARD_TARGET_PLACE_ID = 'way-465724410'
export const CHURCH_DASHBOARD_TARGET_DEPARTMENT = '2부'

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
