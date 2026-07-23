import { describe, expect, it } from 'vitest'
import {
  buildFaithInsightSummary,
  getCurrentDayStreak,
  getFaithNextStep,
} from '../src/lib/faithInsights'

describe('faith journey insights', () => {
  it('keeps a streak active when the latest record was yesterday', () => {
    expect(
      getCurrentDayStreak(
        ['2026-07-20', '2026-07-21', '2026-07-22'],
        '2026-07-23'
      )
    ).toBe(3)
  })

  it('summarizes private rhythms and prayer stages', () => {
    const summary = buildFaithInsightSummary({
      today: '2026-07-23',
      checkins: [
        { checkin_date: '2026-07-23', mood: 'grateful', faith_weather: 'sunny' },
        { checkin_date: '2026-07-22', mood: 'grateful', faith_weather: 'partly_cloudy' },
      ],
      gratitudeDates: ['2026-07-23'],
      prayerDates: ['2026-07-22'],
      prayerPosts: [
        { prayer_stage: 'praying' },
        { prayer_stage: 'answered' },
        { prayer_stage: 'answered' },
      ],
    })

    expect(summary.checkinStreak).toBe(2)
    expect(summary.gratitudeStreak).toBe(1)
    expect(summary.prayerStreak).toBe(1)
    expect(summary.moodCounts.grateful).toBe(2)
    expect(summary.stageCounts.answered).toBe(2)
    expect(summary.recentCheckins).toHaveLength(7)
  })

  it('connects recent mood to an existing next action', () => {
    expect(
      getFaithNextStep({
        checkin_date: '2026-07-23',
        mood: 'anxious',
        faith_weather: 'rainy',
      }).href
    ).toContain('/post/new')
  })
})
