import { describe, expect, it } from 'vitest'
import { getSafeNotificationHref } from '../src/lib/notificationHref'

describe('notification links', () => {
  it('allows only internal app destinations', () => {
    expect(getSafeNotificationHref('/post/abc', null)).toBe('/post/abc')
    expect(getSafeNotificationHref('/praise?from=notification', null)).toBe('/praise?from=notification')
    expect(getSafeNotificationHref('https://evil.example', 'post-id')).toBe('/post/post-id')
    expect(getSafeNotificationHref('//evil.example', null)).toBeNull()
    expect(getSafeNotificationHref('/admin', null)).toBeNull()
  })
})
