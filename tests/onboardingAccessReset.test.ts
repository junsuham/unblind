import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../supabase/migrations/20260718030000_profile_onboarding_and_reset_access.sql',
    import.meta.url,
  ),
  'utf8',
)

describe('first signup consent and approval reset migration', () => {
  it('stores consent on the profile as well as an active access row', () => {
    expect(migration).toContain('alter table public.user_profiles')
    expect(migration).toContain('add column if not exists agreed_at')
    expect(migration).toContain('add column if not exists agreed_version')
    expect(migration).toContain('add column if not exists updated_at')
    expect(migration).toContain('update public.user_profiles')
    expect(migration).toContain('update public.allowed_users')
  })

  it('keeps administrators active while resetting only active member approvals', () => {
    expect(migration).toContain("values ('gkawnstn95@gmail.com', 'active'")
    expect(migration).toContain("where access.status = 'active'")
    expect(migration).toContain("lower(access.email) <> 'gkawnstn95@gmail.com'")
    expect(migration).toContain('from public.admin_roles as role')
  })
})
