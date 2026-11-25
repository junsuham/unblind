import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../src/app/api/manitto/maker/[code]/route'
import { MANITTO_MAKER_TOKEN_HEADER } from '../src/lib/manittoMakerShared'

const { from, rpc, getUser } = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from, rpc } }))
vi.mock('@/lib/communityRequestUser', () => ({ getCommunityRequestUser: getUser }))
vi.mock('@/lib/mutationGuard', () => ({ guardMutation: vi.fn().mockResolvedValue(null) }))

const organizer = '00000000-0000-4000-8000-000000000001'
const personId = '00000000-0000-4000-8000-000000000002'
const roomId = '00000000-0000-4000-8000-000000000003'
const code = 'Ab3_fG4-xyz0'
const invite = 'i'.repeat(43)
const guest = 'g'.repeat(43)
const url = `https://app.example/api/manitto/maker/${code}`
const context = { params: Promise.resolve({ code }) }
const sha256 = (token: string) => createHash('sha256').update(token).digest('hex')
const room = {
  id: roomId, host_user_id: organizer, host_name: '방장', code,
  title: '청년부 기도 마니또', note: '', capacity: 20, status: 'drawn', drawn_at: '2026-11-25',
  expires_at: '2099-12-25',
}

function roomQuery() {
  const query = { select: vi.fn(), eq: vi.fn(), gt: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: room, error: null }) }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.gt.mockReturnValue(query)
  return query
}

function rosterQuery(rows: Array<Record<string, unknown>>) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    returns: vi.fn().mockResolvedValue({ data: rows, error: null }),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  return query
}

function mutation(body: Record<string, unknown>) {
  return new Request(url, {
    method: 'POST',
    headers: { Origin: 'https://app.example', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('prayer manitto private invitations', () => {
  beforeEach(() => {
    from.mockReset()
    rpc.mockReset().mockResolvedValue({ error: null })
    getUser.mockReset().mockResolvedValue(null)
    from.mockReturnValueOnce(roomQuery())
  })

  it('does not disclose a roster or match to a holder of the common link', async () => {
    from.mockReturnValueOnce({ select: () => ({ eq: async () => ({ count: 2, error: null }) }) })
    const response = await GET(new Request(`${url}?host=1`), context)
    const result = await response.json()
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(result).toMatchObject({ isHost: false, participantCount: 2 })
    expect(result).not.toHaveProperty('me')
    expect(result).not.toHaveProperty('hostName')
    expect(result).not.toHaveProperty('participants')
  })

  it('shows the organizer the roster but no credentials or assignments', async () => {
    getUser.mockResolvedValueOnce({ id: organizer })
    from.mockReturnValueOnce({ select: () => ({ eq: async () => ({ count: 2, error: null }) }) })
    from.mockReturnValueOnce(rosterQuery([{ id: personId, name: '룻', invite_pending: true }]))
    const response = await GET(new Request(`${url}?host=1`), context)
    const result = await response.json()
    expect(result).toMatchObject({ isHost: true, hostName: '방장' })
    expect(result.participants).toEqual([{ id: personId, name: '룻', invitePending: true }])
    expect(result).not.toHaveProperty('me')
  })

  it('does not use an unclaimed invitation as a private result token', async () => {
    from.mockReturnValueOnce({ select: () => ({ eq: async () => ({ count: 2, error: null }) }) })
    const eligibleQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    eligibleQuery.select.mockReturnValue(eligibleQuery)
    eligibleQuery.eq.mockReturnValue(eligibleQuery)
    from.mockReturnValueOnce(eligibleQuery)
    const response = await GET(new Request(url, { headers: { [MANITTO_MAKER_TOKEN_HEADER]: invite } }), context)
    expect(eligibleQuery.eq).toHaveBeenCalledWith('invite_pending', false)
    expect(eligibleQuery.eq).toHaveBeenCalledWith('token_hash', sha256(invite))
    expect(await response.json()).toMatchObject({ tokenInvalid: true })
  })

  it('rotates an invitation to a new private credential without exposing either raw token to storage', async () => {
    const response = await POST(mutation({ action: 'claim', inviteToken: invite, guestToken: guest }), context)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(rpc).toHaveBeenCalledWith('claim_manitto_maker_invite', {
      p_room_id: roomId,
      p_invite_hash: sha256(invite),
      p_guest_hash: sha256(guest),
    })
  })

  it('does not let a visitor mint a replacement link for another participant', async () => {
    const response = await POST(mutation({ action: 'invite', participantId: personId }), context)
    expect(response.status).toBe(403)
    expect(rpc).not.toHaveBeenCalled()
  })
})
