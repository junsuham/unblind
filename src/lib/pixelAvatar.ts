export type BibleAvatarPreset = {
  id: string
  name: string
  gender: 'male' | 'female'
  src: string
  caption: string
}

const names = {
  male: [
    ['moses', '모세', '광야에서 백성을 이끈 지도자'],
    ['joseph', '요셉', '꿈을 통해 길을 찾은 사람'],
    ['david', '다윗', '수금을 연주한 목동이자 왕'],
    ['daniel', '다니엘', '낯선 땅에서도 믿음을 지킨 사람'],
    ['peter', '베드로', '그물을 내려놓고 예수님을 따른 제자'],
    ['paul', '바울', '여러 지역을 다니며 복음을 전한 사람'],
    ['noah', '노아', '방주를 지은 사람'],
    ['joshua', '여호수아', '이스라엘 백성을 이끈 지도자'],
    ['elijah', '엘리야', '갈멜산에서 기도한 선지자'],
    ['john', '요한', '예수님을 따른 제자'],
  ],
  female: [
    ['sarah', '사라', '이삭의 어머니'],
    ['rebekah', '리브가', '우물가에서 나그네에게 물을 건넨 사람'],
    ['miriam', '미리암', '소고를 들고 노래한 선지자'],
    ['ruth', '룻', '나오미와 함께 새 삶을 시작한 사람'],
    ['esther', '에스더', '백성을 위해 용기를 낸 왕비'],
    ['mary', '마리아', '예수님의 어머니'],
    ['lydia', '루디아', '자색 옷감을 팔고 사람들을 집에 맞이한 사람'],
    ['priscilla', '브리스길라', '아볼로에게 복음의 길을 설명한 사람'],
    ['deborah', '드보라', '이스라엘을 이끈 사사이자 선지자'],
    ['hannah', '한나', '사무엘의 어머니'],
  ],
} as const

export const bibleAvatarPresets: readonly BibleAvatarPreset[] = (['male', 'female'] as const)
  .flatMap(gender => names[gender].map(([id, name, caption]) => ({
    id,
    name,
    caption,
    gender,
    src: `/avatars/bible-v1/${id}.webp`,
  })))

const presetById = new Map(bibleAvatarPresets.map(preset => [preset.id, preset]))
const presetByName = new Map(bibleAvatarPresets.map(preset => [preset.name, preset]))

export const PIXEL_AVATAR_UPDATED_EVENT = 'unblind:bible-avatar-preset-updated'

export function bibleAvatarStorageKey(scope: string) {
  return `unblind:bible-avatar-preset:v1:${scope}`
}

export function suggestedBibleAvatar(nickname: string): BibleAvatarPreset {
  const name = nickname.trim().replace(/-?[A-Z]+$/, '')
  const sameName = presetByName.get(name)
  if (sameName) return sameName

  // Older nicknames can contain a name not in this catalogue. Suggest from all
  // twenty characters in that case, without inferring anything about the user.
  let hash = 2166136261
  for (const character of nickname) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  return bibleAvatarPresets[(hash >>> 0) % bibleAvatarPresets.length]!
}

export function findBibleAvatarPreset(id: string) {
  return presetById.get(id) ?? null
}

export function readBibleAvatarPreset(scope: string): BibleAvatarPreset | null {
  if (typeof window === 'undefined') return null
  try {
    const id = window.localStorage.getItem(bibleAvatarStorageKey(scope))
    return id ? presetById.get(id) ?? null : null
  } catch {
    return null
  }
}

export function saveBibleAvatarPreset(scope: string, id: string): void {
  if (!presetById.has(id)) throw new Error('목록에 있는 캐릭터를 선택해 주세요.')
  window.localStorage.setItem(bibleAvatarStorageKey(scope), id)
  window.dispatchEvent(new CustomEvent(PIXEL_AVATAR_UPDATED_EVENT, { detail: scope }))
}

export function resetBibleAvatarPreset(scope: string): void {
  window.localStorage.removeItem(bibleAvatarStorageKey(scope))
  window.dispatchEvent(new CustomEvent(PIXEL_AVATAR_UPDATED_EVENT, { detail: scope }))
}
