type ClientEvent = {
  severity?: 'info' | 'warning' | 'error' | 'fatal'
  name: string
  message?: string
  route?: string
  fingerprint?: string
  metadata?: Record<string, string | number | boolean | null>
}

export function reportClientEvent(event: ClientEvent) {
  try {
    const body = JSON.stringify({
      source: 'web',
      route: event.route ?? window.location.pathname,
      ...event,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', new Blob([body], { type: 'application/json' }))
      return
    }

    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // Monitoring must never interrupt the application.
  }
}

