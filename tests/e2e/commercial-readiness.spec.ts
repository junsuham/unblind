import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

test.describe('상용화 필수 공개 화면', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('unblind-launch-splash-seen', '1')
    })
  })

  test('로그인 화면은 정책과 접근 가능한 로그인 수단을 제공한다', async ({ page }) => {
    await page.goto('/login')

    await expect(
      page.getByRole('heading', { name: '기독교 익명 중보 커뮤니티' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Google로 계속하기' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: '이용약관' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: '개인정보 처리방침' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectAccessible(page)
  })

  test('고객지원에서 문의 접수와 정책 확인이 가능하다', async ({ page }) => {
    await page.goto('/support')

    await expect(
      page.getByRole('heading', { name: '언블라인드 고객지원' }),
    ).toBeVisible()
    await expect(page.getByLabel('답변받을 이메일')).toBeVisible()
    await expect(page.getByLabel('문의 유형')).toBeVisible()
    await expect(page.getByLabel('문의 내용')).toBeVisible()
    await expect(page.getByRole('button', { name: '문의 접수' })).toBeVisible()
    await expect(
      page.getByRole('link', { name: '개인정보처리방침' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectAccessible(page)
  })

  test('개인정보처리방침은 문의와 보유 기간을 고지한다', async ({ page }) => {
    await page.goto('/policies/privacy')

    await expect(
      page.getByRole('heading', { name: '개인정보처리방침' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '보유 기간' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: '문의와 권리 행사' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectAccessible(page)
  })

  test('확대 및 동작 줄이기 환경에서도 주요 기능이 잘리지 않는다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/support')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })

    await expect(page.getByRole('button', { name: '문의 접수' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
