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
const prayerRoomPage = source('../src/app/pray/page.tsx')
const pwa = source('../src/app/components/PwaLifecycle.tsx')
const globalStyles = source('../src/app/globals.css')
const layout = source('../src/app/layout.tsx')
const serviceWorker = source('../public/sw.js')
const deviceSettings = source('../src/app/settings/account/DeviceIntegrationSettings.tsx')
const manifest = source('../src/app/manifest.ts')
const vercelConfig = source('../vercel.json')

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

  it('separates church affiliation consent and stores an optional department', () => {
    expect(profileForm).toContain("['연령 확인', '정보 수집 동의', '교회 선택', '가입 요청']")
    expect(profileForm).toContain('churchInfoConsentAccepted: true')
    expect(profileForm).toContain('churchDepartment: churchDepartment.trim()')
    expect(profileForm).toContain('종교·교회 정보 수집 및 이용에 동의합니다.')
    expect(profileApi).toContain('CHURCH_INFO_CONSENT_REQUIRED')
    expect(profileApi).toContain('church_info_consent_at: now')
    expect(profileApi).toContain('church_department: churchDepartment || null')
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
    expect(prayerRoomPage).toContain('topTitle="🍁 기도의 방"')
    expect(prayerRoomPage).toContain('<PrayerRoomScene')
    expect(prayerRoomPage).not.toContain('<PrayerSession')
    expect(prayerRoomPage).not.toContain('기도 요청 쓰기')
    expect(prayerRoomPage).not.toContain('기도 게시판')
    expect(appShell).toMatch(/key: 'prayer',\s*label: '기도',\s*href: '\/pray',\s*icon: 'prayer'/)
  })

  it('does not allow a stale development worker to cache old layouts', () => {
    expect(pwa).toContain("process.env.NODE_ENV !== 'production'")
    expect(pwa).toContain('getRegistrations()')
    expect(pwa).toContain("key.startsWith('unblind-static-')")
    expect(pwa).toContain("pathnameRef.current === '/' || pathnameRef.current === '/login'")
  })

  it('provides progressive native integrations with safe fallbacks', () => {
    expect(serviceWorker).toContain("OUTBOX_SYNC_TAG = 'unblind-outbox-sync'")
    expect(serviceWorker).toContain("url.pathname === '/api/posts' || url.pathname === '/api/comments'")
    expect(serviceWorker).toContain("event.data?.type === 'FLUSH_OUTBOX'")
    expect(deviceSettings).toContain('supabase.auth.registerPasskey()')
    expect(deviceSettings).toContain('navigator.geolocation.getCurrentPosition')
    expect(deviceSettings).toContain('연락처 정보는 언블라인드 서버에 저장되지 않습니다.')
    expect(deviceSettings).toContain('showSaveFilePicker')
    expect(manifest).toContain("share_target")
  })

  it('keeps the Supabase project active with a daily protected check', () => {
    expect(vercelConfig).toContain('"/api/cron/keepalive"')
    expect(source('../src/app/api/cron/keepalive/route.ts')).toContain('Database unavailable')
    expect(source('../src/app/api/cron/keepalive/route.ts')).toContain('Bearer ${cronSecret}')
  })
})
