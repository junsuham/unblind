import 'server-only'

type SourceRange = { spreadsheetId: string; range: string }

type SourceConfig = {
  clientEmail: string
  privateKey: string
  people: SourceRange
  attendance: SourceRange
  prayer: SourceRange
}

type SourceSetup =
  | { status: 'missing' | 'invalid' }
  | { status: 'configured'; config: SourceConfig }

const spreadsheetIdPattern = /^[A-Za-z0-9_-]{20,}$/

function serviceAccount(env: NodeJS.ProcessEnv) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (raw) {
    try {
      const value: unknown = JSON.parse(raw)
      if (!value || typeof value !== 'object') return null
      const account = value as Record<string, unknown>
      return {
        clientEmail: typeof account.client_email === 'string' ? account.client_email.trim() : '',
        privateKey: typeof account.private_key === 'string' ? account.private_key.replace(/\\n/g, '\n').trim() : '',
      }
    } catch {
      return null
    }
  }

  return {
    clientEmail: env.GOOGLE_CLIENT_EMAIL?.trim() ?? '',
    privateKey: env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim() ?? '',
  }
}

function sourceRange(spreadsheetId: string, name: string | undefined, fallback: string, columns: string): SourceRange | null {
  if (!spreadsheetIdPattern.test(spreadsheetId) || /^YOUR_/.test(spreadsheetId)) return null
  const tab = name?.trim() || fallback
  if (tab.length > 100 || /[\r\n]/.test(tab)) return null
  return { spreadsheetId, range: `'${tab.replaceAll("'", "''")}'!${columns}` }
}

/** Local setup validation only: it does not contact Google or imply that sharing permissions are correct. */
export function readChurchDashboardSourceSetup(env: NodeJS.ProcessEnv = process.env): SourceSetup {
  const account = serviceAccount(env)
  if (!account) return { status: 'invalid' }

  const peopleId = env.CHURCH_DASHBOARD_PEOPLE_SHEET_ID?.trim()
  const attendanceId = env.CHURCH_DASHBOARD_ATTENDANCE_SHEET_ID?.trim()
  const prayerId = env.CHURCH_DASHBOARD_PRAYER_SHEET_ID?.trim()
  if (!account.clientEmail || !account.privateKey || !peopleId || !attendanceId || !prayerId) return { status: 'missing' }
  if (!/^[^\s@]+@[^\s@]+\.gserviceaccount\.com$/i.test(account.clientEmail) ||
      !/^-----BEGIN (?:RSA )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]+\s+-----END (?:RSA )?PRIVATE KEY-----$/.test(account.privateKey)) {
    return { status: 'invalid' }
  }

  const people = sourceRange(peopleId, env.CHURCH_DASHBOARD_PEOPLE_SHEET_NAME, 'DB', 'A:ZZ')
  const attendance = sourceRange(attendanceId, env.CHURCH_DASHBOARD_ATTENDANCE_SHEET_NAME, '52주 예배 참불 현황(NUM)', 'A:ZZ')
  const prayer = sourceRange(prayerId, env.CHURCH_DASHBOARD_PRAYER_SHEET_NAME, 'DB', 'A:F')
  if (!people || !attendance || !prayer) return { status: 'invalid' }

  return { status: 'configured', config: { ...account, people, attendance, prayer } }
}
