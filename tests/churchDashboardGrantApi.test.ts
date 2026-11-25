import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST as grantAccess } from '../src/app/api/admin/church-dashboard-access/route'
import { POST as saveConsent } from '../src/app/api/profile/church-consent/route'
import { CHURCH_INFO_CONSENT_VERSION } from '../src/lib/agreement'
import { CHURCH_DASHBOARD_TARGET_PLACE_ID } from '../src/lib/churchDashboardScope'

const { from, rpc, currentUser, communityUser, adminUser, authUserById, mutationGuard } = vi.hoisted(() => ({
  from: vi.fn(), rpc: vi.fn(), currentUser: vi.fn(), communityUser: vi.fn(),
  adminUser: vi.fn(), authUserById: vi.fn(), mutationGuard: vi.fn(),
}))

vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from, rpc, auth: { admin: { getUserById: authUserById } } } }))
vi.mock('@/lib/requestUser', () => ({ getRequestUser: currentUser }))
vi.mock('@/lib/communityRequestUser', () => ({ getCommunityRequestUser: communityUser }))
vi.mock('@/lib/adminRole', () => ({ isAdminUser: adminUser }))
vi.mock('@/lib/mutationGuard', () => ({ guardMutation: mutationGuard }))

const actor = { id: '00000000-0000-4000-8000-000000000001', app_metadata: { provider: 'google' } }
const member = { id: '00000000-0000-4000-8000-000000000002', email: 'member@example.com', app_metadata: { provider: 'google' } }
const profile = {
  completed_at: '2026-01-01', reference_age: 29, church_place_id: CHURCH_DASHBOARD_TARGET_PLACE_ID,
  church_name: '연세중앙교회', church_department: null, church_info_consent_at: '2026-01-02',
}
const approval = { status: 'active', agreed_at: '2026-01-01' }

function readQuery(data: unknown) {
  const query = { select: vi.fn(), update: vi.fn(), eq: vi.fn(), is: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) }
  query.select.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.is.mockReturnValue(query)
  return query
}

function post(body: Record<string, unknown>, origin = 'https://app.example') {
  return new Request('https://app.example/api/test', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function grant(overrides: Record<string, unknown> = {}) {
  return grantAccess(post({
    action: 'grant', userId: member.id, scope: 'verified_2bu', department: '2부',
    verifiedMembership: true, ...overrides,
  }) as NextRequest)
}

beforeEach(() => {
  from.mockReset()
  rpc.mockReset().mockResolvedValue({ error: null })
  currentUser.mockReset().mockResolvedValue(actor)
  communityUser.mockReset().mockResolvedValue(member)
  adminUser.mockReset().mockResolvedValue(true)
  authUserById.mockReset().mockResolvedValue({ data: { user: member }, error: null })
  mutationGuard.mockReset().mockResolvedValue(null)
})

describe('dashboard grants require both consent and administrator verification', () => {
  it('tells an administrator where to recover legacy consent, without granting access', async () => {
    from.mockReturnValueOnce(readQuery({ ...profile, church_info_consent_at: null }))
    from.mockReturnValueOnce(readQuery(approval))
    const result = await grant()
    expect(result.status).toBe(422)
    expect(await result.json()).toMatchObject({ code: 'consent', error: expect.stringContaining('교회 정보 동의') })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('requires a Google administrator and a separate membership attestation', async () => {
    expect((await grant({ verifiedMembership: false })).status).toBe(400)
    currentUser.mockResolvedValueOnce({ ...actor, app_metadata: { provider: 'kakao' } })
    expect((await grant()).status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('allows the audited atomic grant after correcting consent (with explicit verification for missing optional department)', async () => {
    from.mockReturnValueOnce(readQuery(profile)).mockReturnValueOnce(readQuery(approval))
    const result = await grant()
    expect(result.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('set_church_dashboard_access_v2', {
      p_actor_user_id: actor.id, p_target_user_id: member.id,
      p_action: 'grant', p_scope: 'verified_2bu', p_department: '2부',
    })
  })

  it('does not grant a different department or a different place', async () => {
    from.mockReturnValueOnce(readQuery({ ...profile, church_department: '3부' })).mockReturnValueOnce(readQuery(approval))
    expect(await (await grant()).json()).toMatchObject({ code: 'department' })
    from.mockReturnValueOnce(readQuery({ ...profile, church_place_id: 'different-map-id' })).mockReturnValueOnce(readQuery(approval))
    expect(await (await grant()).json()).toMatchObject({ code: 'church' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('permits an existing grant to be revoked even if the member is no longer eligible', async () => {
    expect((await grant({ action: 'revoke', verifiedMembership: false })).status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('set_church_dashboard_access_v2', expect.objectContaining({
      p_target_user_id: member.id, p_action: 'revoke', p_scope: null,
    }))
    expect(from).not.toHaveBeenCalled()
  })
})

describe('member consent recovery', () => {
  const confirmation = { accepted: true, version: CHURCH_INFO_CONSENT_VERSION }

  it('never writes until the signed-in member explicitly accepts the current statement', async () => {
    expect((await saveConsent(post({ ...confirmation, accepted: false }))).status).toBe(400)
    expect((await saveConsent(post({ ...confirmation, version: 'old' }))).status).toBe(400)
    communityUser.mockResolvedValueOnce(null)
    expect((await saveConsent(post(confirmation))).status).toBe(401)
    expect(from).not.toHaveBeenCalled()
  })

  it('only changes the authenticated member’s missing consent and never grants dashboard access', async () => {
    const update = readQuery({ church_info_consent_at: new Date().toISOString() })
    from.mockReturnValueOnce(readQuery({ ...profile, church_info_consent_at: null })).mockReturnValueOnce(update)
    const result = await saveConsent(post({ ...confirmation, userId: actor.id }))
    expect(result.status).toBe(200)
    expect(update.eq).toHaveBeenCalledWith('user_id', member.id)
    expect(update.eq).not.toHaveBeenCalledWith('user_id', actor.id)
    expect(update.is).toHaveBeenCalledWith('church_info_consent_at', null)
    expect(update.update).toHaveBeenCalledWith({
      church_info_consent_at: expect.any(String),
      church_info_consent_version: CHURCH_INFO_CONSENT_VERSION,
      updated_at: expect.any(String),
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not replace an existing consent or change church affiliation', async () => {
    from.mockReturnValueOnce(readQuery(profile)).mockReturnValueOnce(readQuery({ ...profile, church_place_id: 'other' }))
    expect((await saveConsent(post(confirmation))).status).toBe(200)
    expect((await saveConsent(post(confirmation))).status).toBe(409)
    expect(from).toHaveBeenCalledTimes(2)
    expect(rpc).not.toHaveBeenCalled()
  })
})
