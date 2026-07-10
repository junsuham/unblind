import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type UserAction =
  | 'add'
  | 'block'
  | 'unblock'
  | 'reset_agreement'
  | 'remove'
  | 'update_memo'

const validActions: UserAction[] = [
  'add',
  'block',
  'unblock',
  'reset_agreement',
  'remove',
  'update_memo',
]

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN
  const currentToken = request.cookies.get('admin_session')?.value

  if (!expectedToken || currentToken !== expectedToken) {
    return NextResponse.json(
      { error: '관리자 권한이 없습니다.' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)

  const action = body?.action as UserAction | undefined
  const email = normalizeEmail(body?.email)
  const memo =
    typeof body?.memo === 'string' ? body.memo.trim() : null

  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: '유효하지 않은 작업입니다.' },
      { status: 400 }
    )
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: '이메일을 정확히 입력해주세요.' },
      { status: 400 }
    )
  }

  let actionError: { message: string } | null = null

  if (action === 'add') {
    const { error } = await supabaseAdmin
      .from('allowed_users')
      .upsert(
        {
          email,
          status: 'active',
          memo: memo || null,
        },
        {
          onConflict: 'email',
        }
      )

    actionError = error
  }

  if (action === 'block') {
    const { error } = await supabaseAdmin
      .from('allowed_users')
      .update({
        status: 'blocked',
      })
      .eq('email', email)

    actionError = error
  }

  if (action === 'unblock') {
    const { error } = await supabaseAdmin
      .from('allowed_users')
      .update({
        status: 'active',
      })
      .eq('email', email)

    actionError = error
  }

  if (action === 'reset_agreement') {
    const { error } = await supabaseAdmin
      .from('allowed_users')
      .update({
        agreed_at: null,
        agreed_version: null,
      })
      .eq('email', email)

    actionError = error
  }

  if (action === 'remove') {
    const { error } = await supabaseAdmin
      .from('allowed_users')
      .delete()
      .eq('email', email)

    actionError = error
  }

  if (action === 'update_memo') {
    const { error } = await supabaseAdmin
      .from('allowed_users')
      .update({
        memo: memo || null,
      })
      .eq('email', email)

    actionError = error
  }

  if (actionError) {
    return NextResponse.json(
      { error: actionError.message },
      { status: 500 }
    )
  }

  await supabaseAdmin.from('admin_user_actions').insert({
    action_type: action,
    email,
    memo: memo || null,
  })

  return NextResponse.json({ ok: true })
}
