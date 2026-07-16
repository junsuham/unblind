import { describe, expect, it } from 'vitest'
import { isMinuteWithinQuietHours, preferenceKeyForNotification, shouldDeliverPush, type PushPreferences } from '../src/lib/push'

const preferences: PushPreferences = {
  push_enabled: true,
  comments_enabled: true,
  reactions_enabled: false,
  manitto_enabled: true,
  system_enabled: true,
  quiet_start: '22:00',
  quiet_end: '08:00',
}

describe('push preferences', () => {
  it('maps notification types to the correct setting', () => {
    expect(preferenceKeyForNotification('comment')).toBe('comments_enabled')
    expect(preferenceKeyForNotification('reaction')).toBe('reactions_enabled')
    expect(preferenceKeyForNotification('unknown')).toBe('system_enabled')
  })

  it('supports quiet hours that cross midnight', () => {
    expect(isMinuteWithinQuietHours(23 * 60, '22:00', '08:00')).toBe(true)
    expect(isMinuteWithinQuietHours(7 * 60 + 59, '22:00', '08:00')).toBe(true)
    expect(isMinuteWithinQuietHours(12 * 60, '22:00', '08:00')).toBe(false)
  })

  it('respects both per-type switches and quiet hours', () => {
    expect(shouldDeliverPush('comment', preferences, 12 * 60)).toBe(true)
    expect(shouldDeliverPush('reaction', preferences, 12 * 60)).toBe(false)
    expect(shouldDeliverPush('comment', preferences, 23 * 60)).toBe(false)
  })
})
