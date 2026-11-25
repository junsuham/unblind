import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../src/app/api/faith-avatar/generate/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  consume: vi.fn(),
  generate: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/communityRequestUser', () => ({ getCommunityRequestUser: mocks.getUser }))
vi.mock('@/lib/rateLimit', () => ({ consumeRequestRateLimit: mocks.consume }))
vi.mock('@/lib/faithAvatarGeneration', async () => ({
  ...await import('../src/lib/faithAvatarGeneration'),
  generateFaithAvatar: mocks.generate,
}))

const origin = 'https://unbd.vercel.app'
const url = `${origin}/api/faith-avatar/generate`

function formRequest(body: FormData, requestOrigin = origin) {
  return new Request(url, { method: 'POST', headers: { origin: requestOrigin }, body })
}

async function photoForm(consent = true) {
  const data = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#ffd3aa' } })
    .jpeg().toBuffer()
  const form = new FormData()
  form.set('photo', new Blob([new Uint8Array(data)], { type: 'image/jpeg' }), 'test.jpg')
  if (consent) form.set('consent', 'accepted')
  return form
}

beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'not-a-real-key')
  mocks.getUser.mockReset().mockResolvedValue({ id: 'tester' })
  mocks.consume.mockReset().mockResolvedValue({ allowed: true, unavailable: false })
  mocks.generate.mockReset().mockResolvedValue({
    sprite: 'data:image/webp;base64,c3ByaXRl',
    background: 'data:image/webp;base64,YmFja2dyb3VuZA==',
  })
})
afterEach(() => vi.unstubAllEnvs())

describe('faith avatar generation route', () => {
  it('reports availability without exposing the credential', async () => {
    vi.stubEnv('OPENAI_API_KEY', undefined)
    expect(await (await GET(new Request(url))).json()).toEqual({ available: false })
    const response = await POST(formRequest(await photoForm()))
    expect(response.status).toBe(503)
    expect(mocks.consume).not.toHaveBeenCalled()
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('checks origin, community access and consent before paid generation', async () => {
    const otherOrigin = await POST(formRequest(new FormData(), 'https://elsewhere.test'))
    expect(otherOrigin.status).toBe(403)
    expect(mocks.getUser).not.toHaveBeenCalled()
    mocks.getUser.mockResolvedValueOnce(null)
    expect((await POST(formRequest(new FormData()))).status).toBe(401)
    expect((await POST(formRequest(await photoForm(false)))).status).toBe(400)
    expect(mocks.consume.mock.calls.map(([, options]) => options.bucket)).toEqual(['faith-avatar-upload'])
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('fails closed when the durable generation quota is unavailable', async () => {
    mocks.consume.mockResolvedValueOnce({ allowed: true, unavailable: false })
      .mockResolvedValueOnce({ allowed: false, unavailable: true, retryAfter: 42 })
    const response = await POST(formRequest(await photoForm()))
    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('42')
    expect(mocks.generate).not.toHaveBeenCalled()
  })

  it('returns a noncacheable image pair only after checking sharing limits', async () => {
    const response = await POST(formRequest(await photoForm()))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(await response.json()).toHaveProperty('sprite')
    expect(mocks.consume.mock.calls.map(([, options]) => options.bucket)).toEqual([
      'faith-avatar-upload', 'faith-avatar-account-day', 'faith-avatar-app-minute', 'faith-avatar-app-day',
    ])
    expect(mocks.generate).toHaveBeenCalledTimes(1)
  })
})
