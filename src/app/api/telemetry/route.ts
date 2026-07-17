import { getRequestUser } from '@/lib/requestUser'
import { consumeRequestRateLimit } from '@/lib/rateLimit'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sanitizeTelemetry } from '@/lib/telemetry'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const rateLimit = await consumeRequestRateLimit(request, {
    bucket: 'telemetry.ingest',
    limit: 30,
    windowSeconds: 60,
  })

  if (!rateLimit.allowed) {
    return Response.json(
      { error: rateLimit.unavailable ? '이벤트 수집기를 사용할 수 없습니다.' : '요청이 너무 많습니다.' },
      { status: rateLimit.unavailable ? 503 : 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    )
  }

  const body = await request.json().catch(() => null)
  const event = sanitizeTelemetry(body ?? {})
  if (!event) {
    return Response.json({ error: '유효하지 않은 이벤트입니다.' }, { status: 400 })
  }

  const user = await getRequestUser(request)
  const { error } = await supabaseAdmin.from('app_events').insert({
    ...event,
    user_id: user?.id ?? null,
  })

  if (error) {
    console.error('telemetry_insert_failed', error.message)
    return Response.json({ error: '이벤트를 기록하지 못했습니다.' }, { status: 503 })
  }

  return new Response(null, { status: 202 })
}
