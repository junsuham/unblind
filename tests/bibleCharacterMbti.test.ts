import { readFileSync, statSync } from 'node:fs'
import sharp from 'sharp'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bibleCharacterImages,
  bibleCharacters,
  bibleMbtiQuestions,
  calculateBibleMbtiResult,
  type BibleMbtiAnswers,
  type MbtiAxis,
  type MbtiPole,
  type MbtiType,
} from '../src/lib/bibleCharacterMbti'
import { createBibleMbtiShareImage } from '../src/lib/bibleMbtiShareCard'
import { bibleAvatarPresets } from '../src/lib/pixelAvatar'

const axisPoles: Record<MbtiAxis, readonly MbtiPole[]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
}

const homePage = readFileSync(
  new URL('../src/app/page.tsx', import.meta.url),
  'utf8',
)
const homeAppDrawer = readFileSync(
  new URL('../src/app/components/HomeAppDrawer.tsx', import.meta.url),
  'utf8',
)
const mbtiScreen = readFileSync(
  new URL('../src/app/mbti/BibleCharacterMbti.tsx', import.meta.url),
  'utf8',
)
const shareCard = readFileSync(
  new URL('../src/lib/bibleMbtiShareCard.ts', import.meta.url),
  'utf8',
)
const mbtiStyles = readFileSync(
  new URL('../src/app/mbti/mbti.module.css', import.meta.url),
  'utf8',
)

afterEach(() => vi.unstubAllGlobals())

describe('Bible character MBTI', () => {
  it('provides 28 balanced questions and alternates the four axes', () => {
    expect(bibleMbtiQuestions).toHaveLength(28)

    for (const axis of Object.keys(axisPoles) as MbtiAxis[]) {
      expect(bibleMbtiQuestions.filter((question) => question.axis === axis)).toHaveLength(7)
    }

    bibleMbtiQuestions.forEach((question, index) => {
      expect(question.axis).toBe((['EI', 'SN', 'TF', 'JP'] as const)[index % 4])
      expect(new Set(question.options.map((option) => option.pole))).toEqual(
        new Set(axisPoles[question.axis]),
      )
      expect(question.options.every((option) => option.text.trim().length > 0)).toBe(true)
    })
  })

  it('maps every type to one distinct, constructive Bible character profile', () => {
    const types = Object.keys(bibleCharacters) as MbtiType[]
    const names = types.map((type) => bibleCharacters[type].name)

    expect(types).toHaveLength(16)
    expect(new Set(names).size).toBe(16)
    expect(names.some((name) => ['가룟 유다', '이세벨', '아합', '가인', '바로'].includes(name))).toBe(false)

    for (const profile of Object.values(bibleCharacters)) {
      expect(profile.traits).toHaveLength(3)
      expect(profile.records).toHaveLength(2)
      expect(profile.references.length).toBeGreaterThanOrEqual(2)
      expect(profile.reflection.trim().length).toBeGreaterThan(10)
    }
  })

  it('uses the exact character picker art for the eleven matching Bible names', () => {
    const types = Object.keys(bibleCharacters) as MbtiType[]
    const sharedTypes = types.filter((type) => bibleCharacterImages[type].startsWith('/avatars/bible-v1/'))
    expect(sharedTypes).toHaveLength(11)
    expect(new Set(Object.values(bibleCharacterImages)).size).toBe(16)
    for (const type of sharedTypes) {
      const preset = bibleAvatarPresets.find(({ name }) => name === bibleCharacters[type].name)
      expect(bibleCharacterImages[type]).toBe(preset?.src)
    }
    expect(bibleCharacterImages.ESFP).toBe('/avatars/bible-mbti-v1/mary-magdalene.webp')
    expect(bibleCharacterImages.ESFP).not.toBe(bibleAvatarPresets.find(({ id }) => id === 'mary')?.src)
  })

  it('ships all sixteen webp portraits as transparent sprites', async () => {
    for (const imagePath of Object.values(bibleCharacterImages)) {
      const asset = new URL(`../public${imagePath}`, import.meta.url)
      expect(statSync(asset).size).toBeGreaterThan(5_000)
      expect(await sharp(asset.pathname).metadata()).toMatchObject({
        format: 'webp',
        hasAlpha: true,
        width: 192,
        height: 224,
      })
    }
  })

  it('calculates each of the 16 result types from matching answers', () => {
    for (const type of Object.keys(bibleCharacters) as MbtiType[]) {
      const answers = Object.fromEntries(
        bibleMbtiQuestions.map((question) => {
          const chosen = question.options.find((option) => type.includes(option.pole))
          if (!chosen) throw new Error(`No answer for ${question.id} and ${type}`)
          return [question.id, chosen.pole]
        }),
      ) as BibleMbtiAnswers

      const result = calculateBibleMbtiResult(answers)
      expect(result.type).toBe(type)
      expect(result.character).toBe(bibleCharacters[type])
      expect(result.similarity).toBe(100)
    }
  })

  it('links the experience from home and states its reflective scope', () => {
    expect(homePage).toContain('<HomeAppDrawer')
    expect(homeAppDrawer).toContain('href="/mbti"')
    expect(homeAppDrawer).toContain('성경 MBTI')
    expect(mbtiScreen).toContain('나와 닮은 성경 인물은?')
    expect(mbtiScreen).toContain('My Bible character Type Indicator')
    expect(mbtiScreen).toContain('공식 MBTI 검사나 신앙·성격의 평가는 아닙니다')
  })

  it('renders a centered character card and shares a generated PNG file', () => {
    expect(Object.values(bibleCharacterImages).every((path) => path.endsWith('.webp'))).toBe(true)
    expect(mbtiScreen).toContain('className={styles.resultPortrait}')
    expect(mbtiScreen).toContain('alt={`${character.name} 도트 캐릭터`}')
    expect(mbtiStyles).toMatch(/\.resultPortrait img\s*\{[^}]*object-fit:\s*contain;[^}]*image-rendering:\s*pixelated;/)
    expect(mbtiScreen).toContain('결과 이미지 공유하기')
    expect(mbtiScreen).toContain('navigator.canShare?.(fileShare)')
    expect(shareCard).toContain('canvas.toBlob')
    expect(shareCard).toContain('new File([blob]')
    expect(shareCard).toContain("type: 'image/png'")
  })

  it('draws the same portrait at its full aspect ratio on the PNG card', async () => {
    const type = 'ESFP'
    const imageSources: string[] = []
    class FakeImage {
      naturalWidth = 192
      naturalHeight = 224
      onload?: () => void
      set src(value: string) {
        imageSources.push(value)
        this.onload?.()
      }
    }
    const gradient = { addColorStop: vi.fn() }
    const context = {
      imageSmoothingEnabled: true,
      createLinearGradient: vi.fn(() => gradient),
      createRadialGradient: vi.fn(() => gradient),
      fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), arcTo: vi.fn(),
      closePath: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillText: vi.fn(),
      save: vi.fn(), restore: vi.fn(), clip: vi.fn(), ellipse: vi.fn(),
      drawImage: vi.fn(),
    }
    const canvas = {
      width: 0, height: 0,
      getContext: vi.fn(() => context),
      toBlob: (callback: (blob: Blob) => void) => callback(new Blob(['test'], { type: 'image/png' })),
    }
    vi.stubGlobal('Image', FakeImage)
    vi.stubGlobal('document', { createElement: vi.fn(() => canvas) })

    const result = await createBibleMbtiShareImage({ type, character: bibleCharacters[type], similarity: 100, axes: [] })
    expect(imageSources).toEqual([bibleCharacterImages[type]])
    expect(context.drawImage).toHaveBeenCalledExactlyOnceWith(expect.any(FakeImage), 257, 198, 566, 660)
    expect(context.imageSmoothingEnabled).toBe(false)
    expect(result.name).toBe('unblind-bible-mbti-esfp.png')
  })
})
