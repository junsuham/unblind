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

  it('keeps the complete ranking available', () => {
    expect(getSituationSongs(officialPraiseTracks, 'all')).toHaveLength(
      officialPraiseTracks.length,
    )
  })
})

