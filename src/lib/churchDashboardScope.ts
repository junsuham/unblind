export type ChurchDashboardScope = {
  churchPlaceId: string
  churchName: string
  department: string | null
}

export function normalizeChurchScopeName(value: string | null | undefined) {
  return (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR')
}

export function matchesChurchDashboardScope(
  granted: ChurchDashboardScope,
  profile: { churchPlaceId: string | null; department: string | null }
) {
  if (!granted.churchPlaceId.trim() || !profile.churchPlaceId?.trim()) return false
  if (granted.churchPlaceId.trim() !== profile.churchPlaceId.trim()) return false

  return granted.department === null ||
    normalizeChurchScopeName(granted.department) === normalizeChurchScopeName(profile.department)
}
