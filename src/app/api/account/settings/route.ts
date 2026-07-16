import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type NotificationPreferences = {
  push_enabled: boolean
  comments_enabled: boolean
  reactions_enabled: boolean
  manitto_enabled: boolean
  system_enabled: boolean
  quiet_start: string | null
  quiet_end: string | null
}

const defaults: NotificationPreferences = {
  push_enabled: false,
  comments_enabled: true,
  reactions_enabled: true,
  manitto_enabled: true,
  system_enabled: true,
  quiet_start: null,
  quiet_end: null,
}

function parseTime(value: unknown) {
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new Error('방해 금지 시간을 확인해주세요.')
  }
  return `${value}:00`
}

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const [{ data: preferences }, { data: blocks }, { data: reports }] = await Promise.all([
    supabaseAdmin
      .from('notification_preferences')
      .select('push_enabled, comments_enabled, reactions_enabled, manitto_enabled, system_enabled, quiet_start, quiet_end')
      .eq('user_id', user.id)
      .maybeSingle<NotificationPreferences>(),
    supabaseAdmin
      .from('user_blocks')
      .select('blocked_user_id, created_at')
      .eq('blocker_user_id', user.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('reports')
      .select('id, target_type, target_id, reason, status, resolution_note, created_at, resolved_at')
      .eq('reporter_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return Response.json({
    preferences: preferences ?? defaults,
    blocks: blocks ?? [],
    reports: reports ?? [],
  })
}

export async function PATCH(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)

  try {
    const values: NotificationPreferences = {
      push_enabled: Boolean(body?.push_enabled),
      comments_enabled: body?.comments_enabled !== false,
      reactions_enabled: body?.reactions_enabled !== false,
      manitto_enabled: body?.manitto_enabled !== false,
      system_enabled: body?.system_enabled !== false,
      quiet_start: parseTime(body?.quiet_start),
      quiet_end: parseTime(body?.quiet_end),
    }

    const { error } = await supabaseAdmin.from('notification_preferences').upsert({
      user_id: user.id,
      ...values,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return Response.json({ ok: true, preferences: values })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.' },
      { status: 400 }
    )
  }
}
