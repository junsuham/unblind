import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { HomeManittoState } from '../src/lib/homeManitto'
import { HomeAppDrawer } from '../src/app/components/HomeAppDrawer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}))

const ready: HomeManittoState = {
  joined: false,
  isActive: true,
  participantCount: 1,
  recipientNickname: null,
}

function renderDrawer(manitto = ready) {
  return renderToStaticMarkup(createElement(HomeAppDrawer, { manitto, tracks: [] }))
}

describe('home app drawer', () => {
  it('keeps the five navigation shortcuts and two actionable tools', () => {
    const html = renderDrawer()

    expect(html).toContain('언블라인드 앱')
    expect(html).toContain('role="list"')
    for (const [path, label] of [
      ['/journey', '나의 신앙 여정'],
      ['/gratitude', '감사일기 챌린지'],
      ['/recreation', '모임 KIT'],
      ['/mbti', '성경 MBTI'],
      ['/shorts', '크리스천 쇼츠'],
    ]) {
      expect(html).toMatch(new RegExp(`<a(?=[^>]*aria-label="${label}")(?=[^>]*href="${path}")`))
    }

    expect(html).toMatch(/<button(?=[^>]*aria-label="오늘의 찬양")(?![^>]*disabled)/)
    expect(html).toMatch(/<button(?=[^>]*aria-label="마니또 메이커")(?![^>]*disabled)/)
  })

  it('keeps each Manitto state visible and the inactive period disabled', () => {
    const inactive = renderDrawer({ ...ready, isActive: false })
    const waiting = renderDrawer({ ...ready, joined: true, participantCount: 3 })
    const matched = renderDrawer({ ...ready, joined: true, recipientNickname: '마리아-ABCD' })

    expect(inactive).toMatch(/<button(?=[^>]*aria-label="마니또 메이커")(?=[^>]*disabled)/)
    expect(inactive).toContain('다음 주 모임')
    expect(waiting).toContain('대기 중 · 3명')
    expect(waiting).toContain('data-state="waiting"')
    expect(matched).toContain('배정 완료')
    expect(matched).toContain('data-state="matched"')
    expect(matched).toContain('aria-haspopup="dialog"')
    expect(matched).not.toContain('마리아-ABCD')
  })
})
