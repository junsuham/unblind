import { describe, expect, it } from 'vitest'
import {
  getReferenceAge,
  isEligibleReferenceAge,
  isOccupation,
} from '../src/lib/profile'

describe('first signup profile validation', () => {
  it('accepts the full eligible 2026 birth-year boundary', () => {
    expect(getReferenceAge('1967-01-01')).toBe(59)
    expect(getReferenceAge('2006-12-31')).toBe(20)
    expect(isEligibleReferenceAge(getReferenceAge('1967-01-01'))).toBe(true)
    expect(isEligibleReferenceAge(getReferenceAge('2006-12-31'))).toBe(true)
  })

  it('rejects invalid dates and ages outside the signup range', () => {
    expect(getReferenceAge('2000-02-30')).toBeNull()
    expect(getReferenceAge('not-a-date')).toBeNull()
    expect(isEligibleReferenceAge(getReferenceAge('1966-12-31'))).toBe(false)
    expect(isEligibleReferenceAge(getReferenceAge('2007-01-01'))).toBe(false)
  })

  it('accepts only the supported current-status values', () => {
    expect(isOccupation('worker')).toBe(true)
    expect(isOccupation('student')).toBe(true)
    expect(isOccupation('other')).toBe(true)
    expect(isOccupation('unemployed')).toBe(false)
  })
})
