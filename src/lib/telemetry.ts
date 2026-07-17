export type TelemetrySeverity = 'info' | 'warning' | 'error' | 'fatal'
export type TelemetrySource = 'web' | 'mobile' | 'server'

export type TelemetryInput = {
  source?: unknown
  severity?: unknown
  name?: unknown
  message?: unknown
  release?: unknown
  route?: unknown
  fingerprint?: unknown
  metadata?: unknown
}

const sources = new Set<TelemetrySource>(['web', 'mobile', 'server'])
const severities = new Set<TelemetrySeverity>(['info', 'warning', 'error', 'fatal'])

function cleanText(value: unknown, maximum: number) {
  if (typeof value !== 'string') return null
  const clean = value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim()
  return clean ? clean.slice(0, maximum) : null
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: Record<string, string | number | boolean | null> = {}

  for (const [key, item] of Object.entries(value).slice(0, 20)) {
    const safeKey = cleanText(key, 40)
    if (!safeKey) continue
    if (typeof item === 'string') result[safeKey] = cleanText(item, 200)
    else if (typeof item === 'number' && Number.isFinite(item)) result[safeKey] = item
    else if (typeof item === 'boolean' || item === null) result[safeKey] = item
  }

  return result
}

export function sanitizeTelemetry(input: TelemetryInput) {
  const name = cleanText(input.name, 80)
  if (!name || !/^[a-z0-9_.-]+$/i.test(name)) return null

  const source = sources.has(input.source as TelemetrySource)
    ? input.source as TelemetrySource
    : 'web'
  const severity = severities.has(input.severity as TelemetrySeverity)
    ? input.severity as TelemetrySeverity
    : 'info'

  return {
    source,
    severity,
    name,
    message: cleanText(input.message, 1000),
    release: cleanText(input.release, 120),
    route: cleanText(input.route, 240),
    fingerprint: cleanText(input.fingerprint, 120),
    metadata: cleanMetadata(input.metadata),
  }
}

