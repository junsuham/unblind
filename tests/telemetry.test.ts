import { describe, expect, it } from 'vitest'
import { sanitizeTelemetry } from '../src/lib/telemetry'

describe('telemetry sanitization', () => {
  it('keeps bounded operational fields', () => {
    expect(sanitizeTelemetry({
      source: 'mobile',
      severity: 'fatal',
      name: 'mobile.render_error',
      message: 'failure',
      metadata: { durationMs: 42, token: { secret: true } },
    })).toEqual(expect.objectContaining({
      source: 'mobile',
      severity: 'fatal',
      name: 'mobile.render_error',
      metadata: { durationMs: 42 },
    }))
  })

  it('rejects event names that could carry arbitrary text', () => {
    expect(sanitizeTelemetry({ name: 'bad event name!' })).toBeNull()
  })
})
