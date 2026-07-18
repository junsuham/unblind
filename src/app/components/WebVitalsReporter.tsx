'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { reportClientEvent } from '@/lib/clientTelemetry'

const reportedMetrics = new Set(['LCP', 'INP', 'CLS'])

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!reportedMetrics.has(metric.name)) return
    reportClientEvent({
      name: `web.vital.${metric.name.toLowerCase()}`,
      severity: metric.rating === 'poor' ? 'warning' : 'info',
      metadata: {
        value: Math.round(metric.value * 1000) / 1000,
        rating: metric.rating,
        navigationType: metric.navigationType,
      },
    })
  })

  return null
}
