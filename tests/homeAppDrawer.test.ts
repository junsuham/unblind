import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
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

  it('loads seven compact, original square icon images', async () => {
    const html = renderDrawer()
    for (const name of ['journey', 'manitto', 'gratitude', 'recreation', 'mbti', 'shorts', 'praise']) {
      const path = `/icons/app-drawer-v1/${name}.webp`
      expect(html).toContain(`src="${path}"`)
      const data = readFileSync(new URL(`../public${path}`, import.meta.url))
      expect(data.byteLength).toBeLessThan(10_000)
      expect(await sharp(data).metadata()).toMatchObject({ width: 192, height: 192, format: 'webp' })
    }
  })
})
