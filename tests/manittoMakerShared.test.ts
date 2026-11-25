import { describe, expect, it } from 'vitest'
import {
  isManittoMakerCapacity,
  isManittoMakerCode,
  isManittoMakerName,
  isManittoMakerTitle,
  normalizeManittoMakerName,
} from '../src/lib/manittoMakerShared'

describe('Manitto Maker room input', () => {
  it('accepts only the generated 12-character room-code format', () => {
    expect(isManittoMakerCode('Ab3_fG4-xyz0')).toBe(true)
    expect(isManittoMakerCode('Ab3_fG4-xyz')).toBe(false)
    expect(isManittoMakerCode('../my-secret')).toBe(false)
  })

  it('normalizes guest names but rejects control characters and oversized names', () => {
    expect(normalizeManittoMakerName('  홍길동   청년부  ')).toBe('홍길동 청년부')
    expect(isManittoMakerName('홍길동 청년부')).toBe(true)
    expect(isManittoMakerName('')).toBe(false)
    expect(isManittoMakerName('a'.repeat(25))).toBe(false)
    expect(isManittoMakerName('홍길동\u0000')).toBe(false)
  })

  it('bounds room titles and capacity', () => {
    expect(isManittoMakerTitle('청년부 마니또')).toBe(true)
    expect(isManittoMakerTitle('x')).toBe(false)
    expect(isManittoMakerTitle('청년부\u202E')).toBe(false)
    expect(isManittoMakerCapacity(3)).toBe(true)
    expect(isManittoMakerCapacity(50)).toBe(true)
    expect(isManittoMakerCapacity(2)).toBe(false)
    expect(isManittoMakerCapacity(51)).toBe(false)
    expect(isManittoMakerCapacity(3.5)).toBe(false)
  })
})
