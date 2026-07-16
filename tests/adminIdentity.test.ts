import { describe, expect, it } from 'vitest'
import { isAdminEmail } from '../src/lib/adminIdentity'

describe('administrator identity', () => {
  it('recognizes the configured administrator regardless of casing', () => {
    expect(isAdminEmail(' GKAwnst95@gmail.com ')).toBe(true)
  })

  it('does not grant access to other accounts', () => {
    expect(isAdminEmail('member@example.com')).toBe(false)
  })
})
