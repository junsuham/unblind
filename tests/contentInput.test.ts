import { describe, expect, it } from 'vitest'
import { parseBoard, parseContentMentions } from '../src/lib/contentInput'

describe('content input validation', () => {
  it('allows only active community boards', () => {
    expect(parseBoard('prayer')).toBe('prayer')
    expect(parseBoard('daily')).toBe('daily')
    expect(parseBoard('work')).toBeNull()
  })

  it('keeps uploaded images inside the current user path', () => {
    const valid = parseContentMentions([{
      type: 'image',
      label: '',
      storagePath: 'user-id/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    }], 'user-id')
    expect(valid).toHaveLength(1)

    expect(parseContentMentions([{
      type: 'image',
      label: '',
      storagePath: 'another-user/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    }], 'user-id')).toBeNull()
  })

  it('rejects oversized mention lists', () => {
    expect(parseContentMentions(Array.from({ length: 11 }, () => ({ type: 'location' })), 'user-id')).toBeNull()
  })
})
