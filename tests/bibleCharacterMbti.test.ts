import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  bibleCharacters,
  bibleMbtiQuestions,
  calculateBibleMbtiResult,
  type BibleMbtiAnswers,
  type MbtiAxis,
  type MbtiPole,
  type MbtiType,
} from '../src/lib/bibleCharacterMbti'

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
const mbtiScreen = readFileSync(
  new URL('../src/app/mbti/BibleCharacterMbti.tsx', import.meta.url),
  'utf8',
)

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
    expect(homePage).toContain('href="/mbti"')
    expect(homePage).toContain('성경 인물 MBTI')
    expect(mbtiScreen).toContain('My Bible character Type Indicator')
    expect(mbtiScreen).toContain('공식 MBTI 검사나 신앙·성격의 평가는 아닙니다')
  })
})
