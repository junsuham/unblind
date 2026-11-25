import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { HomeAppDrawer } from '../src/app/components/HomeAppDrawer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}))

function renderDrawer() {
  return renderToStaticMarkup(createElement(HomeAppDrawer, { tracks: [] }))
}

describe('home app drawer', () => {
  it('keeps the six navigation shortcuts and the quick praise player', () => {
    const html = renderDrawer()

    expect(html).toContain('언블라인드 앱')
    expect(html).toContain('role="list"')
    for (const [path, label] of [
      ['/journey', '나의 신앙 여정'],
      ['/manitto/maker', '마니또 만들기'],
      ['/gratitude', '감사일기 챌린지'],
      ['/recreation', '모임 KIT'],
      ['/mbti', '성경 MBTI'],
      ['/shorts', '크리스천 쇼츠'],
    ]) {
      expect(html).toMatch(new RegExp(`<a(?=[^>]*aria-label="${label}")(?=[^>]*href="${path}")`))
    }

    expect(html).toMatch(/<button(?=[^>]*aria-label="오늘의 찬양")(?![^>]*disabled)/)
  })

  it('renders seven uncluttered decorative pictograms on a shared vector grid', () => {
    const html = renderDrawer()
    for (const name of ['journey', 'manitto', 'gratitude', 'recreation', 'mbti', 'shorts', 'praise']) {
      expect(html).toMatch(new RegExp(`data-app-icon="${name}" aria-hidden="true"><span[^>]*><svg[^>]*viewBox="0 0 24 24"[^>]*stroke="currentColor"[^>]*focusable="false"`))
    }
    expect(html.match(/<svg/g)).toHaveLength(7)
    expect(html).not.toContain('data-tone=')
    expect(html).not.toContain('<text')
  })

  it('uses a small dedicated mask for the drawer rather than the install icon', () => {
    const mask = readFileSync(new URL('../public/icons/app-drawer-mask-v1.svg', import.meta.url), 'utf8')
    expect(mask).toContain('viewBox="0 0 64 64"')
    expect(mask.length).toBeLessThan(500)
  })
})
