import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { generateBiblicalNickname } from '../src/lib/profile'

describe('single-letter Bible profile names', () => {
  it('uses a Korean Bible name with one uppercase letter and no separator', () => {
    const samples = Array.from({ length: 2000 }, (_, index) => generateBiblicalNickname(`fixture-${index}`))
    expect(samples.every((name) => /^[가-힣]+( [가-힣]+)*[A-Z]$/.test(name))).toBe(true)
    expect(new Set(samples.map((name) => name.slice(-1))).size).toBe(26)
    expect(generateBiblicalNickname('fixture')).toBe(generateBiblicalNickname('fixture'))
  })
  it('reserves unique names atomically and preserves names that are already assigned', () => {
    const sql = readFileSync(new URL('../supabase/migrations/20261125040000_single_letter_bible_nicknames.sql', import.meta.url), 'utf8')
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(sql).toContain('p.nickname = candidate')
    expect(sql).toContain('new.nickname := current_name')
    expect(sql).toContain('before insert or update of nickname')
  })
})
