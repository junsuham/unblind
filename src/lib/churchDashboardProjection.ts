export type ChurchDashboardSnapshotRow = {
  church_place_id: string
  church_name: string
  department: string
  generated_at: string
  member_count: number | null
  attendance_count: number | null
  prayer_contributor_count: number | null
  prayer_minutes: number | null
  care_pending_count: number | null
  upcoming_event_count: number | null
  attendance_weeks: unknown
}

export type ChurchDashboardSnapshot = {
  churchPlaceId: string
  churchName: string
  department: string | null
  generatedAt: string
  memberCount: number | null
  attendanceCount: number | null
  prayerMinutes: number | null
  carePendingCount: number | null
  upcomingEventCount: number | null
  attendanceWeeks: { date: string; label: string; attendance: number | null }[]
}

type RawWeek = { date?: unknown; label?: unknown; attendance?: unknown }

function safeCount(value: number | null) {
  return Number.isSafeInteger(value) && value !== null && value >= 0 ? value : null
}

function privacyCount(value: number | null) {
  const count = safeCount(value)
  return count !== null && count > 0 && count < 5 ? null : count
}

/** Whitelist output fields and mask small groups before they reach a page or API. */
export function projectChurchDashboardSnapshot(row: ChurchDashboardSnapshotRow): ChurchDashboardSnapshot {
  const weeks = Array.isArray(row.attendance_weeks) ? row.attendance_weeks as RawWeek[] : []
  const memberCount = safeCount(row.member_count)
  const smallGroup = memberCount === null || memberCount < 5

  return {
    churchPlaceId: row.church_place_id,
    churchName: row.church_name,
    department: row.department || null,
    generatedAt: row.generated_at,
    memberCount: smallGroup ? null : memberCount,
    attendanceCount: smallGroup ? null : privacyCount(row.attendance_count),
    prayerMinutes: smallGroup || (safeCount(row.prayer_contributor_count) ?? 0) < 5
      ? null
      : safeCount(row.prayer_minutes),
    carePendingCount: smallGroup ? null : privacyCount(row.care_pending_count),
    upcomingEventCount: smallGroup ? null : privacyCount(row.upcoming_event_count),
    attendanceWeeks: smallGroup ? [] : weeks.slice(-12).flatMap((week) => {
      if (!week || typeof week !== 'object' || typeof week.date !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(week.date) || typeof week.label !== 'string' ||
          week.label.length > 40 || !Number.isSafeInteger(week.attendance) ||
          (week.attendance as number) < 0) return []
      return [{ date: week.date, label: week.label, attendance: privacyCount(week.attendance as number) }]
    }),
  }
}
