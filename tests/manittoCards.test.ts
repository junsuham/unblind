import { describe, expect, it } from 'vitest'
import {
  decodeManittoCard,
  encodeManittoCard,
  manittoVerses,
} from '../src/lib/manittoCards'

describe('manitto cards', () => {
  it('keeps legacy messages readable as encouragement cards', () => {
    expect(decodeManittoCard('이번 주도 응원하고 있어요.')).toEqual({
      kind: 'encouragement',
      message: '이번 주도 응원하고 있어요.',
      verse: null,
    })
  })

  it('round-trips a scripture card within the existing body limit', () => {
    const encoded = encodeManittoCard({
      kind: 'scripture',
      message: '이 말씀처럼 평안하기를 기도합니다.',
      verse: manittoVerses[0],
    })
    const decoded = decodeManittoCard(encoded)

    expect(encoded.length).toBeLessThanOrEqual(300)
    expect(decoded.kind).toBe('scripture')
    expect(decoded.message).toBe('이 말씀처럼 평안하기를 기도합니다.')
    expect(decoded.verse?.id).toBe(manittoVerses[0].id)
  })
})

