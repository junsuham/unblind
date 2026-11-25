import {
  CHURCH_DASHBOARD_TARGET_DEPARTMENT,
  CHURCH_DASHBOARD_TARGET_PLACE_ID,
} from './churchDashboardScope'
import type { ChurchDashboardSnapshotRow } from './churchDashboardProjection'

type Cell = string | number | null | undefined
export type SourceValues = Cell[][]

type Table = {
  headers: string[]
  rows: string[][]
}

function cell(value: Cell) {
  return String(value ?? '').trim()
}

function column(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(header.replace(/\s+/g, '')))
}

function table(values: SourceValues, required: string[][]): Table {
  const headerIndex = values.slice(0, 20).findIndex((row) => {
    const headers = row.map(cell)
    return required.every((names) => column(headers, names) >= 0)
  })
  if (headerIndex < 0) throw new Error('source_columns_missing')
  return {
    headers: values[headerIndex].map(cell),
    rows: values.slice(headerIndex + 1).map((row) => row.map(cell)),
  }
}

export function isSecondDepartment(value: Cell) {
  const normalized = cell(value).replace(/\s+/g, '')
  return /(^|[^0-9])2부$/.test(normalized) && !normalized.includes('전도2부')
}

function sourceDate(value: Cell): { key: string; timestamp: number } | null {
  const match = cell(value).match(/^(\d{4})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{1,2})/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return { key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, timestamp: date.getTime() }
}

function nonnegativeInteger(value: Cell) {
  const number = Number(cell(value).replaceAll(',', ''))
  return Number.isSafeInteger(number) && number >= 0 && cell(value) ? number : null
}

function prayerMinutes(value: Cell) {
  const compact = cell(value).replaceAll(',', '').replace(/\s+/g, '')
  if (!compact) return null
  const clock = compact.match(/^(\d{1,2})[:：](\d{1,2})$/)
  if (clock) return Math.min(Number(clock[1]) * 60 + Number(clock[2]), 1440)
  const hours = Number(compact.match(/(\d+(?:\.\d+)?)시간/)?.[1] ?? 0)
  const minutes = Number(compact.match(/(\d+(?:\.\d+)?)분/)?.[1] ?? 0)
  const result = compact.includes('시간') || compact.includes('분') ? hours * 60 + minutes : Number(compact)
  return Number.isFinite(result) && result >= 0 ? Math.min(Math.round(result), 1440) : null
}

function activePerson(value: Cell) {
  const normalized = cell(value).replace(/\s+/g, '').toLowerCase()
  return !['0', 'false', 'n', 'no', 'x', '미활동', '비활동', '제외', '탈퇴'].includes(normalized)
}

/** Produces only 2부 totals; individual names and prayer entries never enter the snapshot. */
export function aggregateSecondDepartmentDashboard(input: {
  people: SourceValues
  attendance: SourceValues
  prayer: SourceValues
  now?: Date
}): ChurchDashboardSnapshotRow {
  const now = input.now ?? new Date()
  const people = table(input.people, [['부서', '부'], ['회원', '이름']])
  const peopleDepartment = column(people.headers, ['부서', '부'])
  const peopleName = column(people.headers, ['회원', '이름'])
  const peopleNumber = column(people.headers, ['교번'])
  const peopleActive = column(people.headers, ['활동여부'])
  const members = new Set<string>()
  for (const row of people.rows) {
    if (!isSecondDepartment(row[peopleDepartment]) || !activePerson(row[peopleActive])) continue
    const name = cell(row[peopleName]).replace(/\s+/g, '')
    if (!name) continue
    members.add(peopleNumber >= 0 && cell(row[peopleNumber]) ? `id:${cell(row[peopleNumber])}` : `name:${name}`)
  }

  const attendance = table(input.attendance, [['부서']])
  const attendanceDepartment = column(attendance.headers, ['부서'])
  if (!attendance.headers.some((header) => sourceDate(header))) throw new Error('attendance_date_columns_missing')
  const departmentRows = attendance.rows.filter((row) => cell(row[attendanceDepartment]).replace(/\s+/g, '') === '2부')
  if (departmentRows.length !== 1) throw new Error('attendance_department_ambiguous')
  const latestAllowed = now.getTime()
  const recentFloor = latestAllowed - 45 * 86_400_000
  const weeks = attendance.headers.flatMap((header, index) => {
    const date = sourceDate(header)
    const value = nonnegativeInteger(departmentRows[0][index])
    return date && date.timestamp <= latestAllowed && date.timestamp >= recentFloor && value !== null
      ? [{ date: date.key, label: `${Number(date.key.slice(5, 7))}.${Number(date.key.slice(8))}`, attendance: value }]
      : []
  }).sort((left, right) => left.date.localeCompare(right.date)).slice(-12)

  const prayer = table(input.prayer, [['부서', '부'], ['이름', '회원'], ['날짜', '기도일', '일자']])
  const prayerDepartment = column(prayer.headers, ['부서', '부'])
  const prayerName = column(prayer.headers, ['이름', '회원'])
  const prayerDate = column(prayer.headers, ['날짜', '기도일', '일자'])
  const prayerTime = prayer.headers.findIndex((header) => header.replace(/\s+/g, '').includes('기도시간'))
  if (prayerTime < 0) throw new Error('prayer_time_column_missing')
  const prayerFloor = latestAllowed - 30 * 86_400_000
  const dailyEntries = new Map<string, { name: string; minutes: number }>()
  for (const row of prayer.rows) {
    if (!isSecondDepartment(row[prayerDepartment])) continue
    const name = cell(row[prayerName]).replace(/\s+/g, '')
    const date = sourceDate(row[prayerDate])
    const minutes = prayerMinutes(row[prayerTime])
    if (!name || !date || date.timestamp < prayerFloor || date.timestamp > latestAllowed || minutes === null) continue
    dailyEntries.set(`${name}:${date.key}`, { name, minutes })
  }
  const contributors = new Set(Array.from(dailyEntries.values(), (entry) => entry.name))
  const totalMinutes = Array.from(dailyEntries.values()).reduce((sum, entry) => sum + entry.minutes, 0)

  return {
    church_place_id: CHURCH_DASHBOARD_TARGET_PLACE_ID,
    church_name: '연세중앙교회 대학청년회',
    department: CHURCH_DASHBOARD_TARGET_DEPARTMENT,
    generated_at: now.toISOString(),
    member_count: members.size,
    attendance_count: weeks.at(-1)?.attendance ?? null,
    prayer_contributor_count: contributors.size,
    prayer_minutes: totalMinutes,
    care_pending_count: null,
    upcoming_event_count: null,
    attendance_weeks: weeks,
  }
}
