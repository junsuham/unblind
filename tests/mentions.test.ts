import { describe, expect, it } from 'vitest'
import { getActiveMention, getLocationMentionLabel, getPraiseMentionLabel, keepPresentMentions, type ContentMention } from '../src/lib/praiseMention'

describe('rich mentions', () => {
  it('recognizes praise and location searches', () => {
    const praise = '@오・찬・추💿은혜'
    const location = '@지역🏞️서울'
    expect(getActiveMention(praise, praise.length)?.kind).toBe('praise')
    expect(getActiveMention(location, location.length)?.kind).toBe('location')
  })

  it('keeps only mention metadata still present in content', () => {
    const praiseLabel = getPraiseMentionLabel('은혜')
    const locationLabel = getLocationMentionLabel('서울역')
    const mentions: ContentMention[] = [
      { type: 'praise', label: praiseLabel, youtubeId: 'abc', title: '은혜', subtitle: '공식' },
      { type: 'location', label: locationLabel, placeId: 'node-1', name: '서울역', address: '서울' },
    ]
    expect(keepPresentMentions(`오늘의 추천 ${praiseLabel}`, mentions)).toEqual([mentions[0]])
  })
})
