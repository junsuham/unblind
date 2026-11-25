export const PROFILE_REFERENCE_YEAR = 2026
export const MIN_PROFILE_AGE = 20
export const MAX_PROFILE_AGE = 59

export const occupationLabels = {
  student: '학생',
  worker: '직장인',
  other: '기타',
} as const

export type Occupation = keyof typeof occupationLabels

const biblicalNames = [
  '노아',
  '아브라함',
  '사라',
  '이삭',
  '리브가',
  '요셉',
  '모세',
  '미리암',
  '여호수아',
  '갈렙',
  '룻',
  '사무엘',
  '다윗',
  '요나단',
  '엘리야',
  '엘리사',
  '에스더',
  '모르드개',
  '다니엘',
  '느헤미야',
  '이사야',
  '예레미야',
  '마리아',
  '베드로',
  '요한',
  '바울',
  '바나바',
  '디모데',
  '루디아',
  '브리스길라',
  '아굴라',
  '스데반',
  '빌립',
  '드보라',
  '한나',
  '나오미',
  '아비가일',
  '훌다',
  '요게벳',
  '십보라',
  '엘리사벳',
  '막달라 마리아',
  '마르다',
  '뵈뵈',
  '유니게',
  '로이스',
  '안나',
  '브살렐',
  '아볼로',
  '에스라',
  '스가랴',
  '말라기',
  '미가',
  '하박국',
  '아모스',
  '호세아',
  '요엘',
  '학개',
  '이사갈',
  '아삽',
  '에브라임',
  '예드두둔',
  '실라',
  '디도',
  '누가',
  '마가',
  '안드레',
  '야고보',
  '나사로',
  '시므온',
] as const

function hashUserId(userId: string) {
  let hash = 2166136261

  for (const character of userId) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function generateBiblicalNickname(userId: string) {
  const seed = hashUserId(userId)
  const name = biblicalNames[seed % biblicalNames.length]
  return `${name}${String.fromCharCode(65 + (Math.floor(seed / biblicalNames.length) % 26))}`
}

export function getReferenceAge(birthDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return PROFILE_REFERENCE_YEAR - year
}

export function isEligibleReferenceAge(age: number | null): age is number {
  return age !== null && age >= MIN_PROFILE_AGE && age <= MAX_PROFILE_AGE
}

export function isOccupation(value: unknown): value is Occupation {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(occupationLabels, value)
  )
}
