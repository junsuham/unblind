import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function healthResponse() {
  const startedAt = Date.now()
  const { error } = await supabaseAdmin
    .from('allowed_users')
    .select('email', { head: true, count: 'estimated' })

  const healthy = !error
  return Response.json({
    ok: healthy,
    database: healthy ? 'available' : 'unavailable',
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? 'local',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    durationMs: Date.now() - startedAt,
  }, {
    status: healthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET() {
  return healthResponse()
}

export async function HEAD() {
  const response = await healthResponse()
  return new Response(null, { status: response.status, headers: response.headers })
}

