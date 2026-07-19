import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getManittoAssignment, getWeeklyManitto } from '@/lib/manitto'
import { getRequestUser } from '@/lib/requestUser'
import { guardMutation } from '@/lib/mutationGuard'
import {
  encodeManittoCard,
  getManittoVerse,
  isManittoCardKind,
} from '@/lib/manittoCards'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  return Response.json(await getWeeklyManitto(user.id))
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  const blocked = await guardMutation(request, {
    bucket: 'manitto-write',
    identity: user.id,
    limit: 12,
    windowSeconds: 60,
  })
  if (blocked) return blocked
  const body = await request.json().catch(() => null)

  if (body?.action === 'join' || body?.action === 'find') {
    const { error } = await supabaseAdmin.from('manitto_participants').upsert({ user_id: user.id, is_active: true, updated_at: new Date().toISOString() })
    if (error) {
      return Response.json({ error: '마니또 참여 상태를 변경하지 못했습니다.' }, { status: 400 })
    }

    const manitto = await getWeeklyManitto(user.id)
    return Response.json({ ok: true, manitto })
  }

  if (body?.action === 'leave') {
    const { error } = await supabaseAdmin.from('manitto_participants').update({ is_active: false, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    return error ? Response.json({ error: '마니또 참여 상태를 변경하지 못했습니다.' }, { status: 400 }) : Response.json({ ok: true })
  }

  if (body?.action === 'message') {
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const cardType = isManittoCardKind(body.cardType)
      ? body.cardType
      : 'encouragement'
    const verse = cardType === 'scripture'
      ? getManittoVerse(body.verseId)
      : null
    const minimumLength = cardType === 'scripture' ? 0 : 2

    if (message.length < minimumLength || message.length > 200) {
      return Response.json({ error: '카드 내용은 200자 이하로 작성해주세요.' }, { status: 400 })
    }
    if (cardType === 'scripture' && !verse) {
      return Response.json({ error: '보낼 말씀을 선택해주세요.' }, { status: 400 })
    }
    const assignment = await getManittoAssignment(user.id)
    if (!assignment.recipientUserId) return Response.json({ error: '현재 배정된 마니또가 없습니다.' }, { status: 400 })

    const { data: blocked } = await supabaseAdmin.from('banned_words').select('word').eq('is_active', true)
    if ((blocked ?? []).some((item) => message.toLowerCase().includes(item.word.toLowerCase()))) {
      return Response.json({ error: '운영 정책상 사용할 수 없는 표현이 포함되어 있습니다.' }, { status: 400 })
    }

    let encodedBody: string
    try {
      encodedBody = encodeManittoCard({ kind: cardType, message, verse })
    } catch {
      return Response.json({ error: '카드 내용이 너무 깁니다.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('manitto_messages').insert({
      week_key: assignment.weekKey,
      sender_id: user.id,
      recipient_id: assignment.recipientUserId,
      body: encodedBody,
    })
    if (error) return Response.json({ error: '응원 쪽지를 보내지 못했습니다.' }, { status: 400 })

    await supabaseAdmin.from('notifications').insert({
      user_id: assignment.recipientUserId,
      type: 'manitto',
      title: cardType === 'thanks'
        ? '마니또에게 감사 카드가 도착했어요'
        : cardType === 'scripture'
          ? '마니또에게 말씀 카드가 도착했어요'
          : '마니또에게 익명 응원 쪽지가 도착했어요',
      body: cardType === 'scripture'
        ? `${verse?.reference ?? '말씀'} · ${message || '당신을 위해 기도하고 있어요.'}`.slice(0, 80)
        : message.slice(0, 80),
      href: '/manitto',
    })
    if (process.env.CRON_SECRET) {
      void fetch(new URL('/api/push/dispatch', request.url), {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => undefined)
    }
    return Response.json({ ok: true })
  }

  return Response.json({ error: '지원하지 않는 요청입니다.' }, { status: 400 })
}
