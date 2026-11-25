import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { POST } from '../src/app/api/prayer-room/live/route'
import { PrayerRoomChat, usePrayerRoomLive } from '../src/app/components/PrayerRoomLive'
import { PrayerRoomScene } from '../src/app/pray/PrayerRoomScene'
import { bibleAvatarPresets } from '../src/lib/pixelAvatar'
import {
  latestPrayerRoomBubbles, parsePrayerRoomMessage, parsePrayerRoomPosition,
  parsePrayerRoomVisitId, prayerRoomMaxY, prayerRoomPoseSrc,
} from '../src/lib/prayerRoomLive'

const { from, rpc, getUser, guard } = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
  guard: vi.fn(),
}))

vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from, rpc } }))
vi.mock('@/lib/communityRequestUser', () => ({ getCommunityRequestUser: getUser }))
vi.mock('@/lib/mutationGuard', () => ({ guardMutation: guard }))

const position = { x: 42.8, y: 1050.4, facing: 'left', avatarId: 'daniel' }
const visitId = 'b27ab3f0-16cf-4001-8095-c18dea820a20'
const userId = '00000000-0000-4000-8000-000000000001'

describe('prayer room exchange input', () => {
  it('uses safe rounded, in-bounds map coordinates and catalog sprites', () => {
    expect(parsePrayerRoomPosition(position)).toEqual({ ...position, x: 43, y: 1050 })
    expect(parsePrayerRoomPosition({ ...position, y: prayerRoomMaxY, isPraying: true })).toEqual({
      ...position, x: 43, y: 2240, isPraying: true,
    })
    expect(parsePrayerRoomPosition({ ...position, y: 1121 }, 1)).toBeNull()
    for (const unsafe of [{ x: -1 }, { y: 2241 }, { y: Infinity }, { facing: 'forward' }, { avatarId: '/image.webp' }, { isPraying: 'true' }]) {
      expect(parsePrayerRoomPosition({ ...position, ...unsafe })).toBeNull()
    }
  })
  it('only accepts an opaque per-visit UUID', () => {
    expect(parsePrayerRoomVisitId(visitId.toUpperCase())).toBe(visitId)
    expect(parsePrayerRoomVisitId(null)).toBeNull()
    expect(parsePrayerRoomVisitId('test')).toBeNull()
  })
  it('permits brief encouragement and rejects links, contact information and oversized input', () => {
    expect(parsePrayerRoomMessage(' 같이\n기도해요! 🙏 ')).toBe('같이 기도해요! 🙏')
    for (const unsafe of ['x'.repeat(161), 'https://example.com', 'example@local.test', '010-0000-0000', 'a\u0000b', ' ']) {
      expect(parsePrayerRoomMessage(unsafe)).toBeNull()
    }
  })
  it('maps only the twenty known portraits to dedicated prayer-pose files', () => {
    expect(new Set(bibleAvatarPresets.map(({ id }) => prayerRoomPoseSrc(id))).size).toBe(20)
    expect(prayerRoomPoseSrc('daniel')).toBe('/avatars/bible-prayer-v1/daniel.webp')
    expect(prayerRoomPoseSrc('../daniel')).toBeNull()
  })
  it('uses the latest message per server nickname and expires bubbles independently of the history', () => {
    const now = Date.parse('2026-11-25T10:00:00Z')
    const message = (id: string, nickname: string, age: number) => ({
      id, nickname, text: id, sentAt: new Date(now - age).toISOString(),
    })
    const latest = message('latest', '다니엘D', 100)
    const otherSpeaker = message('other', '다니엘A', 4500)
    const bubbles = latestPrayerRoomBubbles([
      latest, otherSpeaker, message('old', '다니엘D', 3000), message('stale', '루디아K', 10001),
    ], now)
    expect(bubbles.get('다니엘D')).toBe(latest)
    expect(bubbles.get('다니엘A')).toBe(otherSpeaker)
    expect(bubbles.has('루디아K')).toBe(false)
    expect(latestPrayerRoomBubbles([latest], now + 10_000).size).toBe(0)
  })
})

function ChatExample() {
  return createElement(PrayerRoomChat, { live: usePrayerRoomLive() })
}

it('shows a blank live composer immediately and keeps accessible reporting and privacy guidance', () => {
  const html = renderToStaticMarkup(createElement(ChatExample))
  expect(html).toContain('기도의 방 채팅')
  expect(html).toContain('닉네임과 캐릭터가 보여요')
  expect(html).toContain('보낼 채팅 메시지')
  expect(html).toContain('aria-label="채팅 보내기"')
  expect(html).toContain('aria-label="신고·문의"')
  expect(html).not.toContain('placeholder=')
  expect(html).not.toContain('혼자 하기')
})

it('removes help and puts the icon-only solo toggle directly before the jump button', () => {
  const html = renderToStaticMarkup(createElement(PrayerRoomScene, { storageScope: userId, characterName: '다니엘D' }))
  expect(html).toMatch(/aria-label="혼자 하기"[^>]*><svg.*?<\/button><button[^>]*aria-label="점프"/)
  expect(html).not.toContain('aria-label="조작법"')
})

function mutation(body: Record<string, unknown>) {
  return new Request('https://app.example/api/prayer-room/live', {
    method: 'POST',
    headers: { Origin: 'https://app.example', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('prayer live version compatibility', () => {
  beforeEach(() => {
    from.mockReset()
    rpc.mockReset().mockReturnValue({ returns: async () => ({ data: { peers: [], messages: [], chatSent: false }, error: null }) })
    getUser.mockReset().mockResolvedValue({ id: userId })
    guard.mockReset().mockResolvedValue(null)
  })

  it('does not open a session for a signed-out visitor or a rate-limited request', async () => {
    getUser.mockResolvedValueOnce(null)
    expect((await POST(mutation({ roomVersion: 2, visitId, position }))).status).toBe(401)
    guard.mockResolvedValueOnce(new Response('', { status: 429 }))
    expect((await POST(mutation({ roomVersion: 2, visitId, position }))).status).toBe(429)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('passes only validated v2 pose/coordinates and the server identity', async () => {
    const result = await POST(mutation({ roomVersion: 2, visitId, position: { ...position, y: 2230, isPraying: true }, userId: 'ignored' }))
    expect(result.status).toBe(200)
    expect(result.headers.get('Cache-Control')).toBe('private, no-store')
    expect(rpc).toHaveBeenCalledWith('exchange_prayer_room_state_v2', expect.objectContaining({
      p_user_id: userId, p_y: 2230, p_is_praying: true, p_visit_id: visitId,
    }))
  })

  it('keeps the original protocol working and rejects invalid v2 visits', async () => {
    expect((await POST(mutation({ roomVersion: 2, position }))).status).toBe(400)
    expect((await POST(mutation({ position: { ...position, y: 2000 } }))).status).toBe(400)
    expect((await POST(mutation({ position }))).status).toBe(200)
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('exchange_prayer_room_state', expect.not.objectContaining({ p_visit_id: expect.anything() }))
  })

  it('only removes presence for the signed-in member\'s matching visit', async () => {
    const query = { delete: vi.fn(), eq: vi.fn() }
    query.delete.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    from.mockReturnValue(query)
    const result = await POST(mutation({ roomVersion: 2, visitId, leave: true, userId: 'ignored' }))
    expect(result.status).toBe(200)
    expect(from).toHaveBeenCalledWith('prayer_room_presence')
    expect(query.eq.mock.calls).toEqual([['user_id', userId], ['world_version', 2], ['visit_id', visitId]])
    expect(rpc).not.toHaveBeenCalled()
  })
})
