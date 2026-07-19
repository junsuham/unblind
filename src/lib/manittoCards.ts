export type ManittoCardKind = 'encouragement' | 'thanks' | 'scripture'

export type ManittoVerse = {
  id: string
  reference: string
  text: string
}

export type ManittoCard = {
  kind: ManittoCardKind
  message: string
  verse: ManittoVerse | null
}

const CARD_PREFIX = '__UB_MANITTO_CARD_V1__'

export const manittoVerses: ManittoVerse[] = [
  {
    id: 'numbers-6-24',
    reference: '민수기 6:24–26',
    text: '여호와는 네게 복을 주시고 너를 지키시기를 원하며, 여호와는 그의 얼굴을 네게 비추사 은혜 베푸시기를 원하며, 여호와는 그 얼굴을 네게로 향하여 드사 평강 주시기를 원하노라.',
  },
  {
    id: 'isaiah-41-10',
    reference: '이사야 41:10',
    text: '두려워하지 말라 내가 너와 함께 함이라. 놀라지 말라 나는 네 하나님이 됨이라.',
  },
  {
    id: 'philippians-4-6',
    reference: '빌립보서 4:6–7',
    text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라.',
  },
  {
    id: 'romans-8-28',
    reference: '로마서 8:28',
    text: '하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라.',
  },
]

export function isManittoCardKind(value: unknown): value is ManittoCardKind {
  return value === 'encouragement' || value === 'thanks' || value === 'scripture'
}

export function getManittoVerse(verseId: unknown) {
  return typeof verseId === 'string'
    ? manittoVerses.find((verse) => verse.id === verseId) ?? null
    : null
}

export function encodeManittoCard({
  kind,
  message,
  verse,
}: ManittoCard) {
  const encoded = `${CARD_PREFIX}${JSON.stringify({
    k: kind,
    m: message.trim(),
    v: verse?.id ?? null,
  })}`

  if (encoded.length > 300) {
    throw new Error('카드 내용이 너무 깁니다.')
  }

  return encoded
}

export function decodeManittoCard(body: string): ManittoCard {
  if (!body.startsWith(CARD_PREFIX)) {
    return { kind: 'encouragement', message: body, verse: null }
  }

  try {
    const parsed = JSON.parse(body.slice(CARD_PREFIX.length)) as {
      k?: unknown
      m?: unknown
      v?: unknown
    }
    const kind = isManittoCardKind(parsed.k) ? parsed.k : 'encouragement'
    const message = typeof parsed.m === 'string' ? parsed.m.trim() : ''
    const verse = kind === 'scripture' ? getManittoVerse(parsed.v) : null

    return { kind, message, verse }
  } catch {
    return { kind: 'encouragement', message: body, verse: null }
  }
}

