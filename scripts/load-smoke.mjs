const baseUrl = (process.env.LOAD_BASE_URL ?? 'https://unbd.vercel.app').replace(/\/$/, '')
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? 10)
const requestsPerRoute = Number(process.env.LOAD_REQUESTS_PER_ROUTE ?? 20)
const routes = ['/login', '/support', '/policies/privacy', '/api/health']

const tasks = routes.flatMap((route) =>
  Array.from({ length: requestsPerRoute }, () => route),
)
const timings = []
let failures = 0
let nextIndex = 0

async function worker() {
  while (nextIndex < tasks.length) {
    const route = tasks[nextIndex++]
    const started = performance.now()
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        redirect: 'manual',
        headers: { 'User-Agent': 'unblind-commercial-readiness-smoke/1.0' },
      })
      timings.push(performance.now() - started)
      if (response.status >= 500 || response.status === 0) {
        failures += 1
        console.error(`${route}: HTTP ${response.status}`)
      }
    } catch (error) {
      failures += 1
      console.error(`${route}: ${error instanceof Error ? error.message : error}`)
    }
  }
}

await Promise.all(
  Array.from({ length: Math.max(1, concurrency) }, () => worker()),
)

timings.sort((left, right) => left - right)
const percentile = (value) =>
  timings[Math.min(timings.length - 1, Math.ceil(timings.length * value) - 1)] ?? 0
const p50 = percentile(0.5)
const p95 = percentile(0.95)
const successRate = tasks.length
  ? ((tasks.length - failures) / tasks.length) * 100
  : 0

console.log(
  `Load smoke: ${tasks.length} requests, ${successRate.toFixed(1)}% success, p50 ${p50.toFixed(0)}ms, p95 ${p95.toFixed(0)}ms`,
)

if (failures > 0 || p95 > 3000) process.exit(1)
