import { describe, expect, it } from 'vitest'
import {
  getKoreaDate,
  getMonthRange,
  isFaithMood,
  isFaithWeather,
  isYearMonth,
} from '../src/lib/dailyFaith'
import { isPrayerStage, prayerStageOrder } from '../src/lib/prayerJourney'

describe('daily faith helpers', () => {
  it('uses the Korea calendar date at UTC day boundaries', () => {
    expect(getKoreaDate(new Date('2026-07-22T15:30:00.000Z'))).toBe('2026-07-23')
  })

  it('validates check-in choices', () => {
    expect(isFaithMood('grateful')).toBe(true)
    expect(isFaithMood('angry')).toBe(false)
    expect(isFaithWeather('sunny')).toBe(true)
    expect(isFaithWeather('storm')).toBe(false)
  })

  it('calculates a complete month range including leap years', () => {
    expect(isYearMonth('2028-02')).toBe(true)
    expect(isYearMonth('2028-13')).toBe(false)
    expect(getMonthRange('2028-02')).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    })
  })
})

describe('prayer journey', () => {
  it('keeps the journey in a forward-only order', () => {
    expect(prayerStageOrder).toEqual(['requested', 'praying', 'answered', 'grateful'])
    expect(prayerStageOrder.every(isPrayerStage)).toBe(true)
    expect(isPrayerStage('urgent')).toBe(false)
  })
})
