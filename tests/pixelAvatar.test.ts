import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PIXEL_SPRITE, isGeneratedPixelAvatar } from '../src/lib/pixelAvatar'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('shared local pixel avatar', () => {
  it('requires both results and rejects arbitrary URLs or markup as stored images', () => {
    const sprite = 'data:image/webp;base64,AA=='
    const background = 'data:image/jpeg;base64,BB=='
    expect(isGeneratedPixelAvatar({ sprite, background })).toBe(true)
    expect(isGeneratedPixelAvatar({ sprite })).toBe(false)
    expect(isGeneratedPixelAvatar({ sprite: 'https://example.com/tracker', background })).toBe(false)
    expect(isGeneratedPixelAvatar({ sprite: 'data:image/svg+xml;base64,AA==', background })).toBe(false)
    expect(isGeneratedPixelAvatar({ sprite, background: 'data:image/png;base64,' + 'A'.repeat(2_500_000) })).toBe(false)
  })

  it('uses the same local appearance on home and in the prayer room', () => {
    expect(DEFAULT_PIXEL_SPRITE).toBe('/avatars/faith-player-reference-v2.png')
    expect(read('../src/app/components/FaithAvatarSprite.tsx')).toContain('avatar?.sprite ?? DEFAULT_PIXEL_SPRITE')
    const avatar = read('../src/app/components/FaithAvatar.tsx')
    const room = read('../src/app/pray/PrayerRoomScene.tsx')
    for (const consumer of [avatar, room]) {
      expect(consumer).toContain('useFaithAvatar(storageScope)')
      expect(consumer).toContain('<FaithAvatarSprite avatar={avatar}')
      expect(consumer).not.toContain('PixelAvatarCanvas')
    }
    expect(avatar).toContain('src={avatar.background}')
    expect(room).toContain('/prayer/prayer-room-reference-v2.png')
  })

  it('keeps the check-in choices without the removed copy or accessories', () => {
    const checkin = read('../src/app/components/DailyFaithCheckIn.tsx')
    for (const copy of ['오늘 마음은 어떤가요?', '신앙의 날씨는요?', '오늘의 신앙 체크인']) {
      expect(checkin).not.toContain(copy)
    }
    expect(checkin).toContain('faithMoodOptions.map')
    expect(checkin).toContain('faithWeatherOptions.map')
    const avatar = read('../src/app/components/FaithAvatar.tsx')
    for (const copy of ['얼굴 장식', '망토·스카프', '손 소품', '색상 미리보기', 'appearanceFromPhoto']) {
      expect(avatar).not.toContain(copy)
    }
  })

  it('imports both files locally without the former API or a ChatGPT connection', () => {
    const avatar = read('../src/app/components/FaithAvatar.tsx')
    expect(avatar).toContain('prepareImportedAvatar(spriteFile, backgroundFile)')
    expect(avatar).toContain('writeGeneratedAvatar(storageScope, result)')
    expect(avatar).toContain('임시 채팅')
    expect(avatar).not.toMatch(/fetch\(|PIXEL_AVATAR_ENDPOINT|FormData/)
  })
})
