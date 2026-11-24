import { describe, expect, it } from 'vitest'
import {
  hasOfflineMutationAuthorMismatch,
  OFFLINE_MUTATION_AUTHOR_HEADER,
} from '../src/lib/offlineMutationAuthor'

const firstUser = '11111111-1111-4111-8111-111111111111'
const secondUser = '22222222-2222-4222-8222-222222222222'

describe('offline mutation author binding', () => {
  it('allows a queued request only under its original authenticated account', () => {
    const request = new Request('https://unbd.vercel.app/api/posts', {
      method: 'POST',
      headers: { [OFFLINE_MUTATION_AUTHOR_HEADER]: firstUser },
    })
    expect(hasOfflineMutationAuthorMismatch(request, firstUser)).toBe(false)
    expect(hasOfflineMutationAuthorMismatch(request, secondUser)).toBe(true)
  })

  it('rejects legacy unbound queued requests even when they still have a live session cookie', () => {
    const request = new Request('https://unbd.vercel.app/api/comments', { method: 'POST' })
    expect(hasOfflineMutationAuthorMismatch(request, firstUser)).toBe(true)
  })
})
