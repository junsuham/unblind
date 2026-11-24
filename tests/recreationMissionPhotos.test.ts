import { describe, expect, it } from 'vitest'
import { missionDecks } from '../src/app/recreation/mission/missionCards'

describe('recreation mission photo credits', () => {
  it('provides author, CC0 license, modification note, and original source for every photo card', () => {
    const photoCards = [...missionDecks.food, ...missionDecks.dessert]

    expect(photoCards).toHaveLength(10)
    for (const card of photoCards) {
      expect(card.image).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//)
      expect(card.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(card.photoCredit?.author.trim()).not.toBe('')
      expect(card.photoCredit?.license).toBe('CC0 1.0')
      expect(card.photoCredit?.licenseUrl).toBe('https://creativecommons.org/publicdomain/zero/1.0/')
      expect(card.photoCredit?.modification).toBe('앱 표시용 크기 조정')
    }
  })
})
