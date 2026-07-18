import { describe, expect, it } from 'vitest'
import { getHomeManittoPhase } from '../src/lib/homeManitto'

const baseState = {
  joined: false,
  isActive: true,
  participantCount: 1,
  recipientNickname: null,
}

describe('home manitto flow', () => {
  it('starts ready and becomes waiting after activation', () => {
    expect(getHomeManittoPhase(baseState)).toBe('ready')
    expect(getHomeManittoPhase({ ...baseState, joined: true })).toBe('waiting')
  })

  it('prioritizes a completed match and respects inactive periods', () => {
    expect(getHomeManittoPhase({
      ...baseState,
      joined: true,
      recipientNickname: '익명기도1234',
    })).toBe('matched')
    expect(getHomeManittoPhase({
      ...baseState,
      joined: true,
      isActive: false,
      recipientNickname: '익명기도1234',
    })).toBe('inactive')
  })
})

