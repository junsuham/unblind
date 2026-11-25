import { existsSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ChurchDashboardShortcut } from '../src/app/components/ChurchDashboardShortcut'
import { CHURCH_DASHBOARD_TARGET_PLACE_ID } from '../src/lib/churchDashboardScope'

describe('church dashboard shortcut in My account', () => {
  it('renders the read-only shortcut and its bundled artwork for a verified role', () => {
    const rendered = renderToStaticMarkup(createElement(ChurchDashboardShortcut, {
      access: { churchPlaceId: CHURCH_DASHBOARD_TARGET_PLACE_ID, churchName: '연세중앙교회', department: '2부' },
    }))
    expect(rendered).toContain('href="/church-dashboard"')
    expect(rendered).toContain('src="/icons/church-dashboard-v1.webp"')
    expect(rendered).toContain('대시보드')
    expect(rendered).toContain('연세중앙교회 · 2부 · 읽기 전용')
    expect(existsSync(new URL('../public/icons/church-dashboard-v1.webp', import.meta.url))).toBe(true)
  })

  it('shows a locked notice, without a link or church details, if permission is missing', () => {
    const rendered = renderToStaticMarkup(createElement(ChurchDashboardShortcut, { access: null }))
    expect(rendered).toContain('관리자가 권한을 부여하면 이용할 수 있어요.')
    expect(rendered).toContain('잠김')
    expect(rendered).not.toContain('href=')
    expect(rendered).not.toContain('연세중앙교회')
    expect(rendered).not.toContain('2부')
  })

  it('keeps the shortcut at the top of My account and checks access separately from administrator status', () => {
    const activityPage = readFileSync(new URL('../src/app/activity/page.tsx', import.meta.url), 'utf8')
    expect(activityPage).toContain('getChurchDashboardAccess(user)')
    expect(activityPage).toContain('<ChurchDashboardShortcut access={dashboardAccess} needsChurchConsent={needsChurchConsent} />')
    expect(activityPage.indexOf('<ChurchDashboardShortcut')).toBeLessThan(activityPage.indexOf('href="/journey"'))
  })

  it('offers only the consent form, not dashboard data, to a legacy member missing consent', () => {
    const rendered = renderToStaticMarkup(createElement(ChurchDashboardShortcut, { access: null, needsChurchConsent: true }))
    expect(rendered).toContain('href="/settings/church-consent"')
    expect(rendered).toContain('동의하기')
    expect(rendered).not.toContain('href="/church-dashboard"')
  })
})
