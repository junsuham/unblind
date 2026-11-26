import { readFileSync, readdirSync } from 'node:fs'

const baseUrl = (process.env.SMOKE_BASE_URL ?? 'https://unbd.vercel.app').replace(/\/$/, '')
const localWorker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const workerVersion = localWorker.match(/WORKER_VERSION = '([^']+)'/)?.[1]
if (!workerVersion) throw new Error('Local service worker version is missing')

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

await expectResponse('/recreation', async (response) => {
  if (![200, 307, 308].includes(response.status)) {
    throw new Error(`Recreation KIT returned ${response.status}`)
  }
})

await expectResponse('/mbti', async (response) => {
  if (![200, 307, 308].includes(response.status)) {
    throw new Error(`Bible character MBTI returned ${response.status}`)
  }
})

await expectResponse('/journey', async (response) => {
  if (![200, 307, 308].includes(response.status)) {
    throw new Error(`Faith journey returned ${response.status}`)
  }
})

await expectResponse('/pray', async (response) => {
  if (![200, 307, 308].includes(response.status)) {
    throw new Error(`Prayer session returned ${response.status}`)
  }
})

await expectResponse('/api/faith-avatar/generate', async (response) => {
  if (response.status !== 404) {
    throw new Error('Bible avatars must not expose the retired photo generation endpoint')
  }
})

await expectResponse('/api/prayer-room/live', async (response) => {
  if (response.status !== 405) throw new Error('Prayer room live must not serve a public GET')
})

for (const path of ['/church-dashboard', '/api/church-dashboard/overview', '/api/admin/church-dashboard-access', '/api/cron/church-dashboard', '/settings/church-consent', '/api/profile/church-consent']) {
  await expectResponse(path, async (response) => {
    if (response.status !== 404) throw new Error(`Retired dashboard route is still available: ${path}`)
  })
}

for (const path of ['prayer/golgotha-ascent-v1.webp', 'prayer/pew-pixel-v1.webp']) {
  await expectResponse(`/${path}`, async (response) => {
    if (!response.ok || response.headers.get('content-type') !== 'image/webp') {
      throw new Error(`App artwork is unavailable: ${path}`)
    }
  })
}

await expectResponse('/icons/app-drawer-mask-v1.svg', async (response) => {
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/svg+xml')) {
    throw new Error('Home app drawer mask is unavailable')
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
  if (!manifest.icons.some((icon) => icon.src === '/icons/icon-512-v6.png' && icon.purpose === 'maskable')) {
    throw new Error('The PWA must keep the original UNBLIND installation icon')
  }
  if (manifest.share_target?.action !== '/post/new') {
    throw new Error('PWA share target is unavailable')
  }
})

await expectResponse('/sw.js', async (response) => {
  const body = await response.text()
  if (!response.ok || !body.includes(`WORKER_VERSION = '${workerVersion}'`)) {
    throw new Error('Service worker version is not current')
  }
  if (!body.includes("OUTBOX_DB = 'unblind-offline-outbox-v1'")) {
    throw new Error('Offline mutation outbox is unavailable')
  }
  if (!response.headers.get('cache-control')?.includes('no-store')) {
    throw new Error('Service worker must not be cached')
  }
})

await expectResponse('/icons/emoji-3d/prayer.png', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/png') {
    throw new Error('3D emoji assets are unavailable')
  }
})

await expectResponse('/icons/emoji-3d/siren.png', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/png') {
    throw new Error('Urgent prayer icon is unavailable')
  }
})

for (const path of ['/avatars/faith-player-reference-v2.png', '/prayer/prayer-room-reference-v2.png']) {
  await expectResponse(path, async (response) => {
    if (!response.ok || response.headers.get('content-type') !== 'image/png') {
      throw new Error(`Pixel art reference asset is unavailable: ${path}`)
    }
  })
}

for (const [pack, count] of [['bible-v1', 20], ['bible-prayer-v1', 20], ['bible-mbti-v1', 5], ['bible-scenes-v1', 10], ['bible-scenes-v1/thumbs', 10], ['bible-expressions-v1', 20], ['bible-expressions-v2', 20]]) {
  const images = readdirSync(new URL(`../public/avatars/${pack}/`, import.meta.url)).filter((file) => file.endsWith('.webp'))
  if (images.length !== count) throw new Error(`${pack} must contain ${count} images`)
  await Promise.all(images.map((file) => expectResponse(`/avatars/${pack}/${file}`, async (response) => {
    if (!response.ok || response.headers.get('content-type') !== 'image/webp') {
      throw new Error(`Bible image is unavailable: ${pack}/${file}`)
    }
  })))
}

await expectResponse('/characters/mbti/istj-daniel.png', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/png') {
    throw new Error('Bible character assets are unavailable')
  }
})

await expectResponse('/brand/unblind-wordmark-relief-v5.png', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/png') {
    throw new Error('Relief wordmark is unavailable')
  }
})

await expectResponse('/brand/unblind-monogram-flat-v7.png', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/png') {
    throw new Error('Dark header logo mask is unavailable')
  }
})

await expectResponse('/brand/unblind-monogram-orange-v8.webp', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/webp') {
    throw new Error('Orange header logo is unavailable')
  }
})

await expectResponse('/brand/unblind-slogan-relief-v5.png', async (response) => {
  if (!response.ok || response.headers.get('content-type') !== 'image/png') {
    throw new Error('Relief launch logo is unavailable')
  }
})

for (const icon of ['icons/icon-192-v6.png', 'icons/icon-512-v6.png', 'icons/apple-touch-icon-v6.png', 'brand/unblind-monogram-relief-v5.png']) {
  await expectResponse(`/${icon}`, async (response) => {
    if (!response.ok || response.headers.get('content-type') !== 'image/png') {
      throw new Error(`App icon is unavailable: ${icon}`)
    }
  })
}

for (const [path, original] of [
  ['/icon.png', 'icon-512-v6.png'],
  ['/apple-icon.png', 'apple-touch-icon-v6.png'],
]) {
  await expectResponse(path, async (response) => {
    const expected = readFileSync(new URL(`../public/icons/${original}`, import.meta.url))
    if (!response.ok || !Buffer.from(await response.arrayBuffer()).equals(expected)) {
      throw new Error(`The installed app must keep its original logo: ${path}`)
    }
  })
}

await expectResponse('/offline.html', async (response) => {
  const body = await response.text()
  if (!response.ok || !body.includes('언블라인드')) {
    throw new Error('Offline fallback is incomplete')
  }
})
