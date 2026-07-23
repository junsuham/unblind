import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

const login = source('../src/app/login/page.tsx')
const callback = source('../src/app/auth/callback/route.ts')
const profileForm = source('../src/app/profile/setup/ProfileSetupForm.tsx')
const profileApi = source('../src/app/api/profile/route.ts')
const appShell = source('../src/app/components/ui/AppShell.tsx')
const board = source('../src/app/board/[board]/page.tsx')
const journey = source('../src/app/journey/page.tsx')
const prayerJourneyApi = source('../src/app/api/prayer-journey/route.ts')
const prayerSession = source('../src/app/pray/PrayerSession.tsx')
const pwa = source('../src/app/components/PwaLifecycle.tsx')
const globalStyles = source('../src/app/globals.css')
const layout = source('../src/app/layout.tsx')

describe('commercial readiness regression guard', () => {
  it('locks app zoom globally and prevents iOS focus zoom', () => {
    expect(layout).toContain('width: "device-width"')
    expect(layout).toContain('initialScale: 1')
    expect(layout).toContain('maximumScale: 1')
    expect(layout).toContain('userScalable: false')
    expect(globalStyles).toContain('touch-action: pan-x pan-y;')
    expect(globalStyles).toContain('font-size: 16px !important;')
  })

  it('uses Google account age data instead of self-reported birth dates', () => {
    expect(login).toContain('user.birthday.read')
    expect(callback).toContain('verifyAndStoreSocialAge')
    expect(callback).toContain("provider !== 'google'")
    expect(profileForm).not.toContain('type="date"')
    expect(profileForm).not.toContain('body: JSON.stringify({\n        birthDate,')
    expect(profileApi).toContain('getVerifiedSocialAge(user)')
    expect(profileApi).not.toContain("body?.birthDate")
  })

  it('keeps navigation semantic and removes the persistent write coachmark', () => {
    expect(appShell).toContain("aria-current={isActive ? 'page' : undefined}")
    expect(appShell).not.toContain('익명으로 기도·고민 나눠주세요')
  })

  it('provides real board sorting and bounded pagination', () => {
    expect(board).toContain("filters.sort === 'popular'")
    expect(board).toContain("{ count: 'exact' }")
    expect(board).toContain('.range(rangeStart, rangeStart + pageSize - 1)')
    expect(board).toContain('aria-label="게시글 페이지"')
  })

  it('closes the prayer loop with filters, private insights, and participant updates', () => {
    expect(board).toContain('aria-label="기도여정 필터"')
    expect(board).toContain("postsQuery.eq('prayer_stage', prayerFilter)")
    expect(board).toContain("postsQuery.contains('tags', [URGENT_PRAYER_TAG])")
    expect(journey).toContain('최근 90일의 체크인, 감사, 기도를 한곳에서')
    expect(journey).toContain('신앙 기록은 본인에게만 보이며')
    expect(prayerJourneyApi).toContain('Prayer journey notification failed')
    expect(prayerJourneyApi).toContain("stage === 'answered' || stage === 'grateful'")
    expect(prayerSession).toContain('5분 함께 기도')
    expect(prayerSession).toContain("type: 'pray'")
  })

  it('does not allow a stale development worker to cache old layouts', () => {
    expect(pwa).toContain("process.env.NODE_ENV !== 'production'")
    expect(pwa).toContain('getRegistrations()')
    expect(pwa).toContain("key.startsWith('unblind-static-')")
    expect(pwa).toContain("pathnameRef.current === '/' || pathnameRef.current === '/login'")
  })
})
