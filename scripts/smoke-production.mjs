const baseUrl = (process.env.SMOKE_BASE_URL ?? 'https://unblind-omega.vercel.app').replace(/\/$/, '')

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
