import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { bibleAvatarPresets } from '../src/lib/pixelAvatar'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('shared Bible pixel avatars', () => {
  it.each(bibleAvatarPresets)('ships a small transparent image for $name', async ({ src }) => {
    const file = readFileSync(new URL(`../public${src}`, import.meta.url))
    const image = sharp(file)
    const metadata = await image.metadata()
    const channels = await image.stats()
    expect(metadata).toMatchObject({ format: 'webp', width: 192, height: 224, hasAlpha: true })
    expect(channels.channels[3]?.min).toBe(0)
    expect(channels.channels[3]?.max).toBe(255)
    expect(file.byteLength).toBeLessThan(150_000)
  })

  it('uses the same local appearance on home and in the prayer room', () => {
    expect(read('../src/app/components/FaithAvatarSprite.tsx')).toContain('src={avatar.src}')
    const avatar = read('../src/app/components/FaithAvatar.tsx')
    const room = read('../src/app/pray/PrayerRoomScene.tsx')
    for (const consumer of [avatar, room]) {
      expect(consumer).toContain('useFaithAvatar(storageScope, characterName)')
      expect(consumer).toContain('<FaithAvatarSprite avatar={avatar}')
      expect(consumer).not.toContain('PixelAvatarCanvas')
    }
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

  it('selects a preset without file import or a ChatGPT connection', () => {
    const avatar = read('../src/app/components/FaithAvatar.tsx')
    expect(avatar).toContain('캐릭터 선택')
    expect(avatar).toContain('saveBibleAvatarPreset(storageScope, draft.id)')
    expect(avatar).not.toMatch(/fetch\(|chatgpt\.com|type="file"|FormData/)
  })
})
