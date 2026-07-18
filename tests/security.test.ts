import { describe, expect, it } from 'vitest'
import { isSafeMutationRequest, secretsEqual } from '../src/lib/security'

describe('request security', () => {
  it('compares secrets without accepting partial values', () => {
    expect(secretsEqual('same-secret', 'same-secret')).toBe(true)
    expect(secretsEqual('same', 'same-secret')).toBe(false)
  })

  it('requires same-origin browser mutations', () => {
    expect(isSafeMutationRequest(new Request('https://app.example/api/admin', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    }))).toBe(false)
    expect(isSafeMutationRequest(new Request('https://app.example/api/admin', {
      method: 'POST',
      headers: { origin: 'https://app.example' },
    }))).toBe(true)
    expect(isSafeMutationRequest(new Request('https://app.example/api/admin', {
      method: 'POST',
    }))).toBe(false)
    expect(isSafeMutationRequest(new Request('https://app.example/api/admin', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-user-token' },
    }))).toBe(true)
  })
})
