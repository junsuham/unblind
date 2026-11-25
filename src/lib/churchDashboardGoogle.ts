import 'server-only'

import { GoogleAuth } from 'google-auth-library'
import { aggregateSecondDepartmentDashboard, type SourceValues } from '@/lib/churchDashboardSource'
import { readChurchDashboardSourceSetup } from '@/lib/churchDashboardSourceConfig'

export async function loadSecondDepartmentDashboardSnapshot() {
  const setup = readChurchDashboardSourceSetup()
  if (setup.status === 'missing') return null
  if (setup.status !== 'configured') throw new Error('dashboard_source_config_invalid')
  const config = setup.config

  const auth = new GoogleAuth({
    credentials: { client_email: config.clientEmail, private_key: config.privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const accessToken = await auth.getAccessToken()
  if (!accessToken) throw new Error('dashboard_google_auth_unavailable')
  const read = async ({ spreadsheetId, range }: typeof config.people): Promise<SourceValues> => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`dashboard_sheet_http_${response.status}`)
    const data = await response.json() as { values?: unknown }
    if (!Array.isArray(data.values)) throw new Error('dashboard_sheet_values_invalid')
    return data.values as SourceValues
  }
  const [people, attendance, prayer] = await Promise.all([
    read(config.people),
    read(config.attendance),
    read(config.prayer),
  ])
  return aggregateSecondDepartmentDashboard({ people, attendance, prayer })
}
