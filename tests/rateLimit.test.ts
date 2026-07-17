import { describe, expect, it } from 'vitest'
import { getRequestIdentity, hashRateLimitKey } from '../src/lib/rateLimitKey'

describe('durable request controls', () => {
  it('hashes a stable bounded request identity without storing an address', () => {
    const request = new Request('https://app.example/api', {
      headers: {
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
        'user-agent': 'Unblind/1.0',
      },
    })
    const identity = getRequestIdentity(request)
    const hash = hashRateLimitKey(identity, 'test-salt')

    expect(identity).toBe('203.0.113.7|Unblind/1.0')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).not.toContain('203.0.113.7')
  })
})
