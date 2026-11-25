import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { faithMoodOptions } from '../src/lib/dailyFaith'
import {
  faithExpressionAtlasSrc,
  faithExpressionFrames,
  getFaithExpression,
} from '../src/lib/faithAvatarExpression'

describe('private home avatar expression', () => {
  it('maps the five existing moods to distinct frames and keeps neutral first', () => {
    expect(getFaithExpression(null)).toEqual({ frame: 0, mood: 'neutral', label: undefined })
    expect(faithExpressionFrames).toEqual(['neutral', ...faithMoodOptions.map(({ value }) => value)])
    for (const [index, { value, label }] of faithMoodOptions.entries()) {
      expect(getFaithExpression(value)).toEqual({ frame: index + 1, mood: value, label })
    }
  })

  it('uses only the character name in the asset URL and does not pass the mood to the prayer room', () => {
    expect(faithExpressionAtlasSrc('daniel')).toBe('/avatars/bible-expressions-v1/daniel.webp')
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
    const home = read('../src/app/components/FaithAvatar.tsx')
    expect(home).toMatch(/<FaithAvatarSprite[^>]+mood=\{mood\}/)
    const prayer = read('../src/app/pray/PrayerRoomScene.tsx')
    expect(prayer).toContain('<FaithAvatarSprite')
    expect(prayer).not.toMatch(/<FaithAvatarSprite[^>]+mood=/)
  })
})
