import 'server-only'

import { google } from 'googleapis'
import { aggregateSecondDepartmentDashboard, type SourceValues } from '@/lib/churchDashboardSource'

type SourceConfig = {
  peopleId: string
  attendanceId: string
  prayerId: string
  clientEmail: string
  privateKey: string
}

const spreadsheetIdPattern = /^[A-Za-z0-9_-]{20,}$/

function serviceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (raw) {
    const parsed = JSON.parse(raw) as { client_email?: unknown; private_key?: unknown }
    return {
      clientEmail: typeof parsed.client_email === 'string' ? parsed.client_email : '',
      privateKey: typeof parsed.private_key === 'string' ? parsed.private_key.replace(/\\n/g, '\n') : '',
    }
  }
  return {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL?.trim() ?? '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim() ?? '',
  }
}

function sourceConfig(): SourceConfig | null {
  const account = serviceAccount()
  const peopleId = process.env.CHURCH_DASHBOARD_PEOPLE_SHEET_ID?.trim() ?? ''
  const attendanceId = process.env.CHURCH_DASHBOARD_ATTENDANCE_SHEET_ID?.trim() ?? ''
  const prayerId = process.env.CHURCH_DASHBOARD_PRAYER_SHEET_ID?.trim() ?? ''
  if (!account.clientEmail || !account.privateKey || !peopleId || !attendanceId || !prayerId) return null
  if (![peopleId, attendanceId, prayerId].every((id) => spreadsheetIdPattern.test(id))) {
    throw new Error('dashboard_sheet_id_invalid')
  }
  return { ...account, peopleId, attendanceId, prayerId }
}

export function isChurchDashboardSourceConfigured() {
  return sourceConfig() !== null
}

function sheetRange(name: string, columns: string) {
  if (!name || name.length > 100 || /[\r\n]/.test(name)) throw new Error('dashboard_sheet_name_invalid')
  return `'${name.replaceAll("'", "''")}'!${columns}`
}

export async function loadSecondDepartmentDashboardSnapshot() {
  const config = sourceConfig()
  if (!config) return null

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: config.clientEmail, private_key: config.privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const read = async (spreadsheetId: string, range: string): Promise<SourceValues> => {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range, valueRenderOption: 'FORMATTED_VALUE' })
    return (response.data.values ?? []) as SourceValues
  }
  const [people, attendance, prayer] = await Promise.all([
    read(config.peopleId, sheetRange(process.env.CHURCH_DASHBOARD_PEOPLE_SHEET_NAME?.trim() || 'DB', 'A:ZZ')),
    read(config.attendanceId, sheetRange(process.env.CHURCH_DASHBOARD_ATTENDANCE_SHEET_NAME?.trim() || '52주 예배 참불 현황(NUM)', 'A:ZZ')),
    read(config.prayerId, sheetRange(process.env.CHURCH_DASHBOARD_PRAYER_SHEET_NAME?.trim() || 'DB', 'A:F')),
  ])
  return aggregateSecondDepartmentDashboard({ people, attendance, prayer })
}
