import { guardMutation } from '@/lib/mutationGuard'
import { getRequestUser } from '@/lib/requestUser'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const categories = new Set([
  'account',
  'approval',
  'privacy',
  'safety',
  'technical',
  'other',
])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const category =
    typeof body?.category === 'string' && categories.has(body.category)
      ? body.category
      : null
  const message =
    typeof body?.message === 'string' ? body.message.trim() : ''

  if (!emailPattern.test(email) || email.length > 254) {
    return Response.json(
      { error: '답변받을 이메일 주소를 정확히 입력해주세요.' },
      { status: 400 },
    )
  }

  if (!category) {
    return Response.json(
      { error: '문의 유형을 선택해주세요.' },
      { status: 400 },
    )
  }

  if (message.length < 20 || message.length > 2000) {
    return Response.json(
      { error: '문의 내용을 20자 이상 2,000자 이하로 입력해주세요.' },
      { status: 400 },
    )
  }

  const blocked = await guardMutation(request, {
    bucket: 'support-request',
    identity: email,
    limit: 3,
    windowSeconds: 15 * 60,
  })
  if (blocked) return blocked

  const user = await getRequestUser(request)
  const { error } = await supabaseAdmin.from('support_requests').insert({
    user_id: user?.id ?? null,
    email,
    category,
    message,
    source: 'web',
  })

  if (error) {
    console.error('Support request creation failed:', error.message)
    return Response.json(
      { error: '문의를 접수하지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }

  return Response.json({ ok: true }, { status: 201 })
}
