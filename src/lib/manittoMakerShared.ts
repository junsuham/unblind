export const MANITTO_MAKER_MIN_MEMBERS = 2
export const MANITTO_MAKER_MAX_MEMBERS = 50
export const MANITTO_MAKER_DEFAULT_CAPACITY = 20
export const MANITTO_MAKER_TOKEN_HEADER = 'x-manitto-maker-guest-token'

export function isManittoMakerToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

export function isManittoMakerCode(value: string): boolean {
  return /^[A-Za-z0-9_-]{12}$/.test(value)
}

export function normalizeManittoMakerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isManittoMakerName(value: string): boolean {
  return value.length >= 1 && value.length <= 24 && !/[\p{Cc}\p{Cf}]/u.test(value)
}

export function isManittoMakerTitle(value: string): boolean {
  return value.length >= 2 && value.length <= 60 && !/[\p{Cc}\p{Cf}]/u.test(value)
}

export function isManittoMakerCapacity(value: number): boolean {
  return Number.isInteger(value) && value >= MANITTO_MAKER_MIN_MEMBERS && value <= MANITTO_MAKER_MAX_MEMBERS
}

export const manittoMakerMissions = [
  { title: '오늘의 중보', description: '마니또를 위해 오늘 한 번, 이름을 부르며 기도해 보세요.' },
  { title: '말씀 한 구절', description: '힘이 되는 말씀 한 구절을 골라, 믿음이 담긴 응원과 함께 전해 보세요.' },
  { title: '조용한 섬김', description: '모임에서 상대에게 필요한 작은 도움을 한 가지 건네 보세요.' },
  { title: '감사 한 줄', description: '상대에게서 발견한 고마운 점 한 가지를 익명 쪽지로 전해 보세요.' },
] as const

export function getManittoMakerMission(code: string) {
  const index = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return manittoMakerMissions[index % manittoMakerMissions.length]
}
