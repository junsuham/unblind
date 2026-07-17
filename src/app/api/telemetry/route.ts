import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sanitizeTelemetry } from '@/lib/telemetry'

export const runtime = 'nodejs'

const windows = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(request: Request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const current = windows.get(key)
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + 60_000 })
    return false
  }
  current.count += 1
  return current.count > 30
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
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

