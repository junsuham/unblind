import { describe, expect, it, vi } from 'vitest'
import { readChurchDashboardSourceSetup } from '../src/lib/churchDashboardSourceConfig'

vi.mock('server-only', () => ({}))

// Deliberate non-secret fixtures; validation here only checks the configuration shape.
const privateKey = '-----BEGIN PRIVATE KEY-----\nZml4dHVyZQ==\n-----END PRIVATE KEY-----'
const email = 'reader@example-project.iam.gserviceaccount.com'
const configuredEnv = {
  GOOGLE_CLIENT_EMAIL: email,
  GOOGLE_PRIVATE_KEY: privateKey.replace(/\n/g, '\\n'),
  CHURCH_DASHBOARD_PEOPLE_SHEET_ID: 'example-sheet-people00000',
  CHURCH_DASHBOARD_ATTENDANCE_SHEET_ID: 'example-sheet-attendance00000',
  CHURCH_DASHBOARD_PRAYER_SHEET_ID: 'example-sheet-prayer00000',
}

describe('church dashboard source setup validation', () => {
  it('reports absent settings without returning any credential data', () => {
    expect(readChurchDashboardSourceSetup({})).toEqual({ status: 'missing' })
    expect(readChurchDashboardSourceSetup({ ...configuredEnv, GOOGLE_PRIVATE_KEY: '' })).toEqual({ status: 'missing' })
    expect(readChurchDashboardSourceSetup({ ...configuredEnv, CHURCH_DASHBOARD_PRAYER_SHEET_ID: '' })).toEqual({ status: 'missing' })
  })

  it('keeps malformed JSON, pasted sheet URLs and unsafe tab names out of the setup result', () => {
    for (const overrides of [
      { GOOGLE_SERVICE_ACCOUNT_JSON: '{malformed' },
      { GOOGLE_SERVICE_ACCOUNT_JSON: 'null' },
      { GOOGLE_CLIENT_EMAIL: 'fixture@example.com' },
      { GOOGLE_PRIVATE_KEY: 'not-a-key' },
      { CHURCH_DASHBOARD_PEOPLE_SHEET_ID: 'https://docs.google.com/spreadsheets/d/test' },
      { CHURCH_DASHBOARD_PRAYER_SHEET_ID: 'YOUR_2BU_PRAYER_SPREADSHEET_ID' },
      { CHURCH_DASHBOARD_PEOPLE_SHEET_NAME: 'DB\nattendee' },
    ]) {
      expect(readChurchDashboardSourceSetup({ ...configuredEnv, ...overrides })).toEqual({ status: 'invalid' })
    }
  })

  it('supports the existing tabs and escapes custom tab names', () => {
    const setup = readChurchDashboardSourceSetup({
      ...configuredEnv,
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: email, private_key: privateKey }),
      CHURCH_DASHBOARD_PRAYER_SHEET_NAME: "2부's 자료",
    })
    expect(setup).toEqual({
      status: 'configured',
      config: {
        clientEmail: email,
        privateKey,
        people: { spreadsheetId: configuredEnv.CHURCH_DASHBOARD_PEOPLE_SHEET_ID, range: "'DB'!A:ZZ" },
        attendance: { spreadsheetId: configuredEnv.CHURCH_DASHBOARD_ATTENDANCE_SHEET_ID, range: "'52주 예배 참불 현황(NUM)'!A:ZZ" },
        prayer: { spreadsheetId: configuredEnv.CHURCH_DASHBOARD_PRAYER_SHEET_ID, range: "'2부''s 자료'!A:F" },
      },
    })
  })
})
