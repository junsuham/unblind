import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  getVisiblePostTags,
  isUrgentPrayerPost,
  parsePostTags,
  URGENT_PRAYER_TAG,
} from '../src/lib/urgentPrayer'

const apiSource = readFileSync(
  new URL('../src/app/api/posts/route.ts', import.meta.url),
  'utf8',
)
const webWriterSource = readFileSync(
  new URL('../src/app/post/new/NewPostForm.tsx', import.meta.url),
  'utf8',
)
const mobileWriterSource = readFileSync(
  new URL('../mobile/src/app/post/new.tsx', import.meta.url),
  'utf8',
)

describe('urgent intercessory prayer posts', () => {
  it('marks only prayer-board posts with the reserved tag', () => {
    expect(isUrgentPrayerPost('prayer', [URGENT_PRAYER_TAG])).toBe(true)
    expect(isUrgentPrayerPost('faith', [URGENT_PRAYER_TAG])).toBe(false)
    expect(isUrgentPrayerPost('prayer', [])).toBe(false)
  })

  it('keeps the reserved marker out of user-visible and user-submitted tags', () => {
    expect(getVisiblePostTags(['위로', URGENT_PRAYER_TAG])).toEqual(['위로'])
    expect(parsePostTags(['#위로', URGENT_PRAYER_TAG, '위로'])).toEqual(['위로'])
  })

  it('validates urgent status on the server and exposes the control in both writers', () => {
    expect(apiSource).toContain("body?.urgentPrayer === true && board === 'prayer'")
    expect(webWriterSource).toContain('긴급 중보기도 요청')
    expect(webWriterSource).toContain('urgentPrayer: board === \'prayer\' && urgentPrayer')
    expect(mobileWriterSource).toContain('긴급 중보기도 요청')
    expect(mobileWriterSource).toContain('urgentPrayer: board === \'prayer\' && urgentPrayer')
  })
})
