import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { listAllAuthUsers } from '@/lib/adminUsers'
import { isAdminRequest } from '@/lib/adminAuth'
import { getRequestUser } from '@/lib/requestUser'

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

  return value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: '관리자 권한이 없습니다.' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)

  const action = body?.action as UserAction | undefined
  const email =
    normalizeEmail(body?.email) ||
    normalizeEmail(request.headers.get('x-unblind-target-email'))
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
      { error: '선택한 사용자의 이메일을 확인할 수 없습니다. 화면을 새로고침한 뒤 다시 시도해주세요.' },
      { status: 400 }
    )
  }

  const { data: allowedRows, error: allowedLookupError } = await supabaseAdmin
    .from('allowed_users')
    .select('email')
    .returns<{ email: string }[]>()

  if (allowedLookupError) {
    return NextResponse.json(
      { error: allowedLookupError.message },
      { status: 500 }
    )
  }

  const storedEmail = allowedRows?.find(
    (row) => normalizeEmail(row.email) === email
  )?.email

  let actionError: { message: string } | null = null

  if (action === 'add') {
    const authResult = await listAllAuthUsers()
    const hasSignedUp = authResult.users.some(
      (user) => user.email?.toLowerCase() === email
    )

    if (hasSignedUp) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('completed_at, reference_age')
        .ilike('email', email)
        .maybeSingle<{ completed_at: string; reference_age: number }>()

      if (
        !profile?.completed_at ||
        profile.reference_age < 20 ||
        profile.reference_age > 59
      ) {
        return NextResponse.json(
          { error: '연령 확인과 가입 정보 입력이 완료된 사용자만 승인할 수 있습니다.' },
          { status: 400 }
        )
      }
    }

    const request = supabaseAdmin
      .from('allowed_users')

    const { error } = storedEmail
      ? await request
          .update({ status: 'active', memo: memo || null })
          .eq('email', storedEmail)
      : await request.upsert(
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
    const request = supabaseAdmin
      .from('allowed_users')

    const { error } = storedEmail
      ? await request.update({ status: 'blocked' }).eq('email', storedEmail)
      : await request.upsert(
          {
            email,
            status: 'blocked',
          },
          {
            onConflict: 'email',
          }
        )

    actionError = error
  }

  if (action === 'unblock') {
    const request = supabaseAdmin
      .from('allowed_users')

    const { error } = storedEmail
      ? await request.update({ status: 'active' }).eq('email', storedEmail)
      : await request.upsert(
          {
            email,
            status: 'active',
          },
          {
            onConflict: 'email',
          }
        )

    actionError = error
  }

  if (action === 'reset_agreement') {
    if (!storedEmail) {
      return NextResponse.json(
        { error: '승인 목록에서 해당 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('allowed_users')
      .update({
        agreed_at: null,
        agreed_version: null,
      })
      .eq('email', storedEmail)

    actionError = error
  }

  if (action === 'remove') {
    if (!storedEmail) {
      return NextResponse.json(
        { error: '이미 승인 목록에서 제거된 사용자입니다.' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('allowed_users')
      .delete()
      .eq('email', storedEmail)

    actionError = error
  }

  if (action === 'update_memo') {
    if (!storedEmail) {
      return NextResponse.json(
        { error: '승인 목록에서 해당 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('allowed_users')
      .update({
        memo: memo || null,
      })
      .eq('email', storedEmail)

    actionError = error
  }

  if (actionError) {
    return NextResponse.json(
      { error: actionError.message },
      { status: 500 }
    )
  }

  const adminUser = await getRequestUser(request)
  await supabaseAdmin.from('admin_user_actions').insert({
    action_type: action,
    email,
    memo: memo || null,
    admin_email: adminUser?.email ?? null,
  })

  return NextResponse.json({ ok: true })
}
