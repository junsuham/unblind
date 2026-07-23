export type PraiseSituationKey =
  | 'all'
  | 'weary'
  | 'decision'
  | 'restoration'
  | 'community'

export type PraiseSituation = {
  key: PraiseSituationKey
  label: string
  description: string
  trackIds: string[]
  keywords: string[]
}

export const praiseSituations: PraiseSituation[] = [
  {
    key: 'all',
    label: '이번 주 TOP50',
    description: '공식 찬양 채널의 이번 주 인기곡을 살펴보세요.',
    trackIds: [],
    keywords: [],
  },
  {
    key: 'weary',
    label: '지쳤을 때',
    description: '새 힘과 위로가 필요한 순간',
    trackIds: [
      'lV3zSKZYdEQ',
      'sQN1IgfJXKs',
      'LaO19EbMzcE',
      'uecwkxY9tiY',
      '0wcTqurzRdI',
      '5N2R8lNNBJ4',
      'ZvINdEeqcUs',
      'Yqod83GKE0M',
    ],
    keywords: ['새 힘', '위로', '약하', '혼자', '소망', '함께', '지나고'],
  },
  {
    key: 'decision',
    label: '결정을 앞뒀을 때',
    description: '주님의 뜻과 인도를 구하는 시간',
    trackIds: [
      'yf6RQOOwRPA',
      'mrjRlnrhoYs',
      'RdtAYWGw98E',
      'H56xVRKQ2Ag',
      'gaG8xq_tQXA',
      'ufD_Ov6umK4',
      'pt928N-Treg',
      '8vyncunFqjk',
    ],
    keywords: ['걸음', '인도', '뜻', '따라', '푯대', '길', '마음 내게'],
  },
  {
    key: 'restoration',
    label: '회개와 회복',
    description: '다시 주님께 마음을 드리는 예배',
    trackIds: [
      'Ctl6Q1t_OSQ',
      'PRlEqQJ9c10',
      'U1YJM2rlNpo',
      'fjyzLK7fdJc',
      'dL-XAmNtJLA',
      'COV8-ZlfZPg',
      'Htiplroe8wc',
      'tCyIkG3QTwU',
    ],
    keywords: ['회복', '소생', '다시', '마음', '은혜', '가까이', '십자가'],
  },
  {
    key: 'community',
    label: '공동체를 위해',
    description: '서로 사랑하고 함께 세워지는 기도',
    trackIds: [
      'hAJNiYuiUww',
      'FO8Aa-qu8HA',
      'hYw08KqzKrw',
      'I-i2yA1e5F4',
      '4RRxhqKsTA8',
      '16G7beqQmmQ',
      'ShcrG8ENGpY',
      'Yc7do4CqsoU',
    ],
    keywords: ['우리', '함께', '사랑', '세상', '흘러', '지어져', '공동체'],
  },
]

export function getPraiseSituation(key: PraiseSituationKey) {
  return praiseSituations.find((situation) => situation.key === key) ?? praiseSituations[0]
}

export function getSituationSongs<T extends { id: string; title: string }>(
  songs: T[],
  key: PraiseSituationKey,
) {
  if (key === 'all') return songs

  const situation = getPraiseSituation(key)
  const trackIds = new Set(situation.trackIds)
  const selected = songs.filter((song) => {
    if (trackIds.has(song.id)) return true
    const normalizedTitle = song.title.toLowerCase()
    return situation.keywords.some((keyword) =>
      normalizedTitle.includes(keyword.toLowerCase())
    )
  })

  if (selected.length) return selected

  const fallbackIndex = Math.max(
    0,
    praiseSituations.findIndex((item) => item.key === key) - 1,
  )
  const fallbackStart = fallbackIndex * 6
  return songs.slice(fallbackStart, fallbackStart + 8)
}
