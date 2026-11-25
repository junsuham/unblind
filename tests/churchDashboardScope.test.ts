import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isChurchDashboardTarget, matchesChurchDashboardScope } from '../src/lib/churchDashboardScope'
import { projectChurchDashboardSnapshot, type ChurchDashboardSnapshotRow } from '../src/lib/churchDashboardProjection'

const migration = readFileSync(
  new URL('../supabase/migrations/20261124020000_church_dashboard_access.sql', import.meta.url),
  'utf8',
)
const secondDepartmentMigration = readFileSync(
  new URL('../supabase/migrations/20261125020000_church_dashboard_verified_2bu.sql', import.meta.url),
  'utf8',
)
const auditActionMigration = readFileSync(
  new URL('../supabase/migrations/20261125070000_allow_church_dashboard_audit_actions.sql', import.meta.url),
  'utf8',
)

describe('church dashboard access boundaries', () => {
  const snapshotRow: ChurchDashboardSnapshotRow = {
    church_place_id: 'place-one',
    church_name: '연세중앙교회',
    department: '청년부',
    generated_at: '2026-11-24T00:00:00.000Z',
    member_count: 12,
    attendance_count: 7,
    prayer_contributor_count: 6,
    prayer_minutes: 32,
    care_pending_count: 1,
    upcoming_event_count: 3,
    attendance_weeks: [
      { date: '2026-11-01', label: '11월 1주', attendance: 3, privateName: 'should never leave the server' },
      { date: '2026-11-08', label: '11월 2주', attendance: 6 },
    ],
  }

  it('accepts the same verified place and assigned department despite spacing differences', () => {
    expect(matchesChurchDashboardScope(
      { churchPlaceId: 'place-one', churchName: '연세중앙교회', department: ' 청년 1부 ' },
      { churchPlaceId: 'place-one', department: '청년  1부' },
    )).toBe(true)
  })

  it('rejects another place even if the churches have identical names', () => {
    expect(matchesChurchDashboardScope(
      { churchPlaceId: 'place-one', churchName: '연세중앙교회', department: null },
      { churchPlaceId: 'place-two', department: null },
    )).toBe(false)
    expect(matchesChurchDashboardScope(
      { churchPlaceId: 'place-one', churchName: '연세중앙교회', department: '1부' },
      { churchPlaceId: 'place-one', department: '2부' },
    )).toBe(false)
  })

  it('allows a church-wide grant only within that church', () => {
    expect(matchesChurchDashboardScope(
      { churchPlaceId: 'place-one', churchName: '연세중앙교회', department: null },
      { churchPlaceId: 'place-one', department: '2부' },
    )).toBe(true)
  })
  it('accepts an empty self-reported department only after a separate administrator verification', () => {
    const granted = { churchPlaceId: 'place-one', churchName: '연세중앙교회', department: '2부' }
    const profile = { churchPlaceId: 'place-one', department: null }
    expect(matchesChurchDashboardScope(granted, profile)).toBe(false)
    expect(matchesChurchDashboardScope(granted, profile, true)).toBe(true)
    expect(matchesChurchDashboardScope(granted, { ...profile, churchPlaceId: 'place-two' }, true)).toBe(false)
    expect(matchesChurchDashboardScope(granted, { ...profile, department: '3부' }, true)).toBe(false)
  })
  it('limits the linked dashboard to the explicitly requested 2부 scope', () => {
    expect(isChurchDashboardTarget({ churchPlaceId: 'way-465724410', department: '2부' })).toBe(true)
    expect(isChurchDashboardTarget({ churchPlaceId: 'way-465724410', department: null })).toBe(false)
    expect(isChurchDashboardTarget({ churchPlaceId: 'way-465724410', department: '3부' })).toBe(false)
    expect(isChurchDashboardTarget({ churchPlaceId: 'other-place', department: '2부' })).toBe(false)
  })

  it('denies legacy profiles without a place identifier', () => {
    expect(matchesChurchDashboardScope(
      { churchPlaceId: 'place-one', churchName: '연세중앙교회', department: null },
      { churchPlaceId: null, department: null },
    )).toBe(false)
  })

  it('masks whole small groups and individual small counts', () => {
    const small = projectChurchDashboardSnapshot({ ...snapshotRow, member_count: 4 })
    expect(small.memberCount).toBeNull()
    expect(small.attendanceCount).toBeNull()
    expect(small.prayerMinutes).toBeNull()
    expect(small.attendanceWeeks).toEqual([])

    const large = projectChurchDashboardSnapshot(snapshotRow)
    expect(large.memberCount).toBe(12)
    expect(large.carePendingCount).toBeNull()
    expect(large.upcomingEventCount).toBeNull()
    expect(large.attendanceWeeks[0].attendance).toBeNull()
    expect(large.attendanceWeeks[1].attendance).toBe(6)
    expect(JSON.stringify(large)).not.toContain('privateName')
    expect(projectChurchDashboardSnapshot({ ...snapshotRow, prayer_contributor_count: 1 }).prayerMinutes).toBeNull()
  })

  it('keeps role and aggregate data off direct browser database access', () => {
    expect(migration).toContain('create table if not exists public.church_dashboard_access')
    expect(migration).toContain('create table if not exists public.church_dashboard_snapshots')
    expect(migration).toContain('revoke all on public.church_dashboard_access from anon, authenticated')
    expect(migration).toContain('revoke all on public.church_dashboard_snapshots from anon, authenticated')
    expect(migration).toContain('primary key (church_place_id, department)')
    expect(migration).toContain('set_church_dashboard_access')
    expect(migration).toContain('grant execute on function public.set_church_dashboard_access')
    expect(migration).toContain('insert into public.admin_user_actions')
    expect(migration).toContain('revoke all on function public.set_church_dashboard_access')
    expect(secondDepartmentMigration).toContain("v_profile.church_place_id <> 'way-465724410'")
    expect(secondDepartmentMigration).toContain("p_department <> '2부'")
    expect(secondDepartmentMigration).toContain('revoke all on function public.set_church_dashboard_access_v2')
  })

  it('accepts the two dashboard audit events without losing the legacy admin actions', () => {
    const oldActions = ['add', 'block', 'unblock', 'reset_agreement', 'remove', 'update_memo']
    const auditEvents = [...new Set(secondDepartmentMigration.match(/'church_dashboard_(grant|revoke)'/g))]
      .map((event) => event.slice(1, -1))
    const allowed = auditActionMigration.match(/check\s*\(action_type in \(([\s\S]*?)\)\);/)?.[1]
    const actions = [...(allowed?.matchAll(/'([a-z_]+)'/g) ?? [])].map((entry) => entry[1])

    expect(auditEvents).toEqual(['church_dashboard_grant', 'church_dashboard_revoke'])
    expect(actions).toEqual([...oldActions, ...auditEvents])
    expect(auditActionMigration).toContain('drop constraint if exists admin_user_actions_action_type_check')
    expect(auditActionMigration).toContain('add constraint admin_user_actions_action_type_check')
    expect(auditActionMigration).not.toMatch(/grant\s+execute|create\s+or\s+replace\s+function/)
  })
})
