const sceneRows = [
  ['eden', '에덴동산', '창 2:8–10'],
  ['ararat', '아라랏산', '창 8:4'],
  ['red-sea', '홍해', '출 14:21–22'],
  ['sinai', '시내산', '출 19:18–20'],
  ['bethlehem', '베들레헴', '눅 2:4–7'],
  ['galilee', '갈릴리 호수', '눅 5:1–3'],
  ['beatitudes', '팔복의 언덕', '마 5:1–3'],
  ['jordan', '요단강', '마 3:13'],
  ['gethsemane', '겟세마네', '마 26:36'],
  ['emmaus', '엠마오 길', '눅 24:13–15'],
] as const

export type BibleAvatarSceneId = (typeof sceneRows)[number][0]

export const bibleAvatarScenes = sceneRows.map(([id, name, reference]) => ({
  id,
  name,
  reference,
  src: `/avatars/bible-scenes-v1/${id}.webp`,
  thumbnailSrc: `/avatars/bible-scenes-v1/thumbs/${id}.webp`,
}))

const sceneById = new Map(bibleAvatarScenes.map(scene => [scene.id as string, scene]))

export const DEFAULT_BIBLE_AVATAR_SCENE = 'galilee' satisfies BibleAvatarSceneId
export const BIBLE_AVATAR_SCENE_UPDATED_EVENT = 'unblind:bible-avatar-scene-updated'

export function getBibleAvatarScene(id: BibleAvatarSceneId) {
  return sceneById.get(id) ?? sceneById.get(DEFAULT_BIBLE_AVATAR_SCENE)!
}

export function bibleAvatarSceneStorageKey(scope: string) {
  return `unblind:bible-avatar-scene:v1:${scope}`
}

export function readBibleAvatarSceneId(scope: string): BibleAvatarSceneId {
  if (typeof window === 'undefined') return DEFAULT_BIBLE_AVATAR_SCENE

  try {
    const id = window.localStorage.getItem(bibleAvatarSceneStorageKey(scope))
    return (id ? sceneById.get(id)?.id : undefined) ?? DEFAULT_BIBLE_AVATAR_SCENE
  } catch {
    return DEFAULT_BIBLE_AVATAR_SCENE
  }
}

export function saveBibleAvatarSceneId(scope: string, id: BibleAvatarSceneId) {
  if (!sceneById.has(id)) throw new Error('목록에 있는 배경을 선택해 주세요.')

  window.localStorage.setItem(bibleAvatarSceneStorageKey(scope), id)
  window.dispatchEvent(new CustomEvent(BIBLE_AVATAR_SCENE_UPDATED_EVENT, { detail: scope }))
}
