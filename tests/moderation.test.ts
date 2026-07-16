import { describe, expect, it } from 'vitest'
import { analyzeTextForSafety } from '../src/lib/moderation'

describe('content safety rules', () => {
  it('blocks phone numbers and email addresses', () => {
    expect(analyzeTextForSafety('010-1234-5678로 연락해').blockingIssues.map((item) => item.code)).toContain('phone')
    expect(analyzeTextForSafety('test@example.com').blockingIssues.map((item) => item.code)).toContain('email')
  })

  it('detects urgent self-harm language without silently blocking help seeking', () => {
    const result = analyzeTextForSafety('요즘 죽고 싶다는 생각이 들어요')
    expect(result.dangerIssues.map((item) => item.code)).toContain('self-harm')
    expect(result.blockingIssues).toHaveLength(0)
  })

  it('allows normal anonymous support content', () => {
    const result = analyzeTextForSafety('오늘 마음이 힘들어서 함께 기도해주셨으면 좋겠어요.')
    expect(result.issues).toHaveLength(0)
  })
})
