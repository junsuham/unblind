import { describe, expect, it } from 'vitest'
import { officialPraiseTracks } from '../src/lib/officialPraiseTracks'
import {
  getSituationSongs,
  praiseSituations,
} from '../src/lib/praiseSituations'

describe('situational praise recommendations', () => {
  it('provides a curated list for every situation', () => {
    for (const situation of praiseSituations) {
      const tracks = getSituationSongs(officialPraiseTracks, situation.key)
      expect(tracks.length).toBeGreaterThan(0)
    }
  })

  it('labels the complete ranking as this week TOP50', () => {
    expect(praiseSituations[0].label).toBe('이번 주 TOP50')
    expect(getSituationSongs(officialPraiseTracks.slice(0, 50), 'all')).toHaveLength(50)
  })
})
