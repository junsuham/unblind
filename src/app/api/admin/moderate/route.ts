import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isAdminRequest } from '@/lib/adminAuth'
import { getRequestUser } from '@/lib/requestUser'

type ActionType = 'hide' | 'delete' | 'restore' | 'dismiss'
type TargetType = 'post' | 'comment'

const validActions: ActionType[] = ['hide', 'delete', 'restore', 'dismiss']
const validTargetTypes: TargetType[] = ['post', 'comment']
const uuidPattern = /^[0-9a-f-]{36}$/i

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: '관리자 권한이 없습니다.' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)

  const action = body?.action as ActionType | undefined
  const targetType = body?.targetType as TargetType | undefined
  const targetId = body?.targetId as string | undefined
  const reportId = body?.reportId as string | undefined
  const memo = typeof body?.memo === 'string' ? body.memo.trim().slice(0, 500) : null

  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: '유효하지 않은 조치입니다.' },
      { status: 400 }
    )
  }

  if (!targetType || !validTargetTypes.includes(targetType)) {
    return NextResponse.json(
      { error: '유효하지 않은 대상 유형입니다.' },
      { status: 400 }
    )
  }

  if (!targetId || !uuidPattern.test(targetId)) {
    return NextResponse.json(
      { error: '대상 ID가 없습니다.' },
      { status: 400 }
    )
  }

  if (reportId && !uuidPattern.test(reportId)) {
    return NextResponse.json({ error: '신고 ID를 확인하지 못했습니다.' }, { status: 400 })
  }

  if (!memo || memo.length < 3) {
    return NextResponse.json({ error: '조치 사유를 3자 이상 입력해주세요.' }, { status: 400 })
  }

  const adminUser = await getRequestUser(request)
  const { error } = await supabaseAdmin.rpc('moderate_content', {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_report_id: reportId ?? null,
    p_memo: memo,
    p_admin_email: adminUser?.email ?? 'admin-session',
  })

  if (error) {
    console.error('Atomic moderation failed:', error.message)
    return NextResponse.json({ error: '조치를 완료하지 못했습니다. 상태를 새로고침한 뒤 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
