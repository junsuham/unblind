import { reportClientEvent } from '@/lib/clientTelemetry'

window.addEventListener('error', (event) => {
  reportClientEvent({
    name: 'web.unhandled_error',
    severity: 'error',
    message: event.message,
    fingerprint: `${event.filename ?? 'unknown'}:${event.lineno ?? 0}`,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'Unknown rejection')
  reportClientEvent({ name: 'web.unhandled_rejection', severity: 'error', message: reason })
})

window.addEventListener('load', () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (!navigation) return
  reportClientEvent({
    name: 'web.navigation_timing',
    metadata: {
      domInteractiveMs: Math.round(navigation.domInteractive),
      loadMs: Math.round(navigation.loadEventEnd),
    },
  })
}, { once: true })

export function onRouterTransitionStart(url: string, navigationType: 'push' | 'replace' | 'traverse') {
  performance.mark(`unblind-navigation-${navigationType}`)
  reportClientEvent({ name: 'web.navigation', route: new URL(url, window.location.origin).pathname, metadata: { navigationType } })
}

