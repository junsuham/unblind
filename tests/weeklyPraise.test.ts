import { describe, expect, it } from 'vitest'
import { officialPraiseTracks } from '../src/lib/officialPraiseTracks'
import { rankWeeklyPraiseCandidates, WEEKLY_PRAISE_LIMIT } from '../src/lib/weeklyPraise'

describe('weekly praise ranking', () => {
  it('ranks playable official-channel videos and always returns 50 safe fallbacks', () => {
    const videos = [
      {
        id: 'recentSong1',
        snippet: {
          title: '새 찬양 Official Live',
          channelId: 'official-channel',
          channelTitle: '공식 찬양팀',
          publishedAt: '2026-07-20T00:00:00.000Z',
          liveBroadcastContent: 'none',
        },
        contentDetails: { duration: 'PT4M10S' },
        status: { privacyStatus: 'public', embeddable: true },
        statistics: { viewCount: '250000' },
      },
      {
        id: 'sermonSong1',
        snippet: {
          title: '주일 설교 말씀',
          channelId: 'official-channel',
          channelTitle: '공식 찬양팀',
          publishedAt: '2026-07-21T00:00:00.000Z',
          liveBroadcastContent: 'none',
        },
        contentDetails: { duration: 'PT10M' },
        status: { privacyStatus: 'public', embeddable: true },
        statistics: { viewCount: '999999' },
      },
    ]

    const result = rankWeeklyPraiseCandidates(
      videos,
      officialPraiseTracks,
      new Date('2026-07-23T00:00:00.000Z'),
    )

    expect(result).toHaveLength(WEEKLY_PRAISE_LIMIT)
    expect(result[0]).toMatchObject({ id: 'recentSong1', artist: '공식 찬양팀' })
    expect(result.some((track) => track.id === 'sermonSong1')).toBe(false)
    expect(new Set(result.map((track) => track.id)).size).toBe(WEEKLY_PRAISE_LIMIT)
  })
})
