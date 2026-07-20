const baseUrl = (process.env.SMOKE_BASE_URL ?? 'https://unbd.vercel.app').replace(/\/$/, '')

async function expectResponse(path, validate) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'unblind-release-smoke/1.0' },
  })
  await validate(response)
  console.log(`OK ${response.status} ${path}`)
}

await expectResponse('/api/health', async (response) => {
  const body = await response.json()
  if (!response.ok || body.ok !== true || body.database !== 'available') {
    throw new Error(`Health check failed: ${response.status}`)
  }
})

await expectResponse('/login', async (response) => {
  if (response.status !== 200) throw new Error(`Login page returned ${response.status}`)
  const expectedHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
  }
  for (const [name, expected] of Object.entries(expectedHeaders)) {
    if (response.headers.get(name) !== expected) {
      throw new Error(`Missing security header ${name}`)
    }
  }
  const body = await response.text()
  if (!body.includes('<html') || body.length < 1_000) {
    throw new Error('Login page did not return a complete HTML document')
  }
})

await expectResponse('/', async (response) => {
  if (![200, 307, 308].includes(response.status)) {
    throw new Error(`App entry returned ${response.status}`)
  }
})

await expectResponse('/builder-preview/home', async (response) => {
  if (response.status !== 200) {
    throw new Error(`Builder preview returned ${response.status}`)
  }
  const body = await response.text()
  if (!body.includes('홈 편집 영역')) {
    throw new Error('Builder preview is incomplete')
  }
})

await expectResponse('/manifest.webmanifest', async (response) => {
  const manifest = await response.json()
  if (!response.ok || manifest.name !== '언블라인드' || manifest.display !== 'standalone') {
    throw new Error('PWA manifest is incomplete')
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
    throw new Error('PWA icons are incomplete')
  }
})

await expectResponse('/sw.js', async (response) => {
  const body = await response.text()
  if (!response.ok || !body.includes("WORKER_VERSION = '26'")) {
    throw new Error('Service worker version is not current')
  }
  if (!response.headers.get('cache-control')?.includes('no-store')) {
    throw new Error('Service worker must not be cached')
  }
})

await expectResponse('/offline.html', async (response) => {
  const body = await response.text()
  if (!response.ok || !body.includes('언블라인드')) {
    throw new Error('Offline fallback is incomplete')
  }
})
