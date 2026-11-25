import { describe, expect, it } from 'vitest'
import { aggregateSecondDepartmentDashboard, isSecondDepartment } from '../src/lib/churchDashboardSource'

describe('2부 dashboard source aggregation', () => {
  it('rejects lookalike or different departments', () => {
    expect(isSecondDepartment('대학청년회 2부')).toBe(true)
    expect(isSecondDepartment('2 부')).toBe(true)
    expect(isSecondDepartment('연세중앙교회 대학청년회 ２부')).toBe(true)
    expect(isSecondDepartment('전도2부')).toBe(false)
    expect(isSecondDepartment('초등부 2부')).toBe(false)
    expect(isSecondDepartment('다른교회 대학청년회 2부')).toBe(false)
    expect(isSecondDepartment('12부')).toBe(false)
    expect(isSecondDepartment('3부')).toBe(false)
  })

  it('keeps names, member numbers, and per-person prayer entries out of stored data', () => {
    const snapshot = aggregateSecondDepartmentDashboard({
      people: [
        ['회원', '교번', '부서', '활동 여부'],
        ['가명가', '1001', '2부', 'O'],
        ['가명나', '1002', '2부', 'O'],
        ['가명다', '1003', '대학청년회 2부', 'O'],
        ['가명라', '1004', '2부', 'O'],
        ['가명마', '1005', '2부', 'O'],
        ['가명가', '1001', '2부', 'O'],
        ['다른부서', '9999', '3부', 'O'],
        ['다른2부', '9998', '고등부 2부', 'O'],
        ['비활동', '1006', '2부', 'X'],
      ],
      attendance: [
        ['부서', '2026.11.15', '2026.11.22'],
        ['2부', '5', '7'],
        ['3부', '40', '50'],
      ],
      prayer: [
        ['부서', '이름', '날짜', '기도시간'],
        ['2부', '가명가', '2026.11.24', '30분'],
        ['2부', '가명나', '2026.11.24', '1시간'],
        ['2부', '가명다', '2026.11.24', '00:15'],
        ['2부', '가명라', '2026.11.24', '10'],
        ['2부', '가명마', '2026.11.24', '5'],
        ['3부', '다른부서', '2026.11.24', '300분'],
        ['고등부 2부', '다른2부', '2026.11.24', '300분'],
      ],
      now: new Date('2026-11-25T00:00:00.000Z'),
    })
    expect(snapshot.church_place_id).toBe('way-465724410')
    expect(snapshot.department).toBe('2부')
    expect(snapshot.member_count).toBe(5)
    expect(snapshot.attendance_count).toBe(7)
    expect(snapshot.prayer_contributor_count).toBe(5)
    expect(snapshot.prayer_minutes).toBe(120)
    expect(snapshot.attendance_weeks).toHaveLength(2)
    const serialized = JSON.stringify(snapshot)
    expect(serialized).not.toContain('가명가')
    expect(serialized).not.toContain('1001')
    expect(serialized).not.toContain('다른부서')
  })

  it('fails closed when the source has no unique 2부 attendance row', () => {
    expect(() => aggregateSecondDepartmentDashboard({
      people: [['회원', '부서'], ['가명가', '2부']],
      attendance: [['부서', '2026.11.22'], ['3부', '50']],
      prayer: [['부서', '이름', '날짜', '기도시간']],
    })).toThrow('attendance_department_ambiguous')
  })

  it('fails closed without a prayer department column; it does not match people by name', () => {
    expect(() => aggregateSecondDepartmentDashboard({
      people: [['회원', '부서'], ['가명가', '2부']],
      attendance: [['부서', '2026.11.22'], ['2부', '50']],
      prayer: [['이름', '날짜', '기도시간'], ['가명가', '2026.11.24', '30분']],
    })).toThrow('source_columns_missing')
  })
})
