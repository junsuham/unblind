import { afterEach, describe, expect, it } from 'vitest'
import { isAdminEmail } from '../src/lib/adminIdentity'

describe('administrator identity', () => {
  const original = process.env.ADMIN_EMAILS

  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = original
  })

  it('recognizes the configured administrator regardless of casing', () => {
    process.env.ADMIN_EMAILS = 'gkawnst95@gmail.com'
    expect(isAdminEmail(' GKAwnst95@gmail.com ')).toBe(true)
  })

  it('does not grant access to other accounts', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    expect(isAdminEmail('member@example.com')).toBe(false)
  })
})
