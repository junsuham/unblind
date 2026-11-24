import { describe, expect, it } from 'vitest'
import { bootstrapAdminRoleDecision, storedAdminRoleDecision } from '../src/lib/adminRolePolicy'

describe('administrator role bootstrap policy', () => {
  it('allows a first rollout bootstrap only after the role write succeeds', () => {
    expect(storedAdminRoleDecision(null, false)).toBeNull()
    expect(bootstrapAdminRoleDecision(true, false)).toBe(true)
    expect(bootstrapAdminRoleDecision(false, false)).toBe(false)
    expect(bootstrapAdminRoleDecision(true, true)).toBe(false)
  })

  it('never revives an explicitly inactive role', () => {
    expect(storedAdminRoleDecision({ is_active: false }, false)).toBe(false)
  })

  it('fails closed when the role lookup fails', () => {
    expect(storedAdminRoleDecision(null, true)).toBe(false)
    expect(storedAdminRoleDecision({ is_active: true }, true)).toBe(false)
  })
})
