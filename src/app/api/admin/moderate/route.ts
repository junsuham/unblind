import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type ActionType = 'hide' | 'delete' | 'restore' | 'dismiss'
type TargetType = 'post' | 'comment'

const validActions: ActionType[] = ['hide', 'delete', 'restore', 'dismiss']
const validTargetTypes: TargetType[] = ['post', 'comment']

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

  const action = body?.action as ActionType | undefined
  const targetType = body?.targetType as TargetType | undefined
  const targetId = body?.targetId as string | undefined
  const reportId = body?.reportId as string | undefined

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

  if (!targetId) {
    return NextResponse.json(
      { error: '대상 ID가 없습니다.' },
      { status: 400 }
    )
  }

  if (action !== 'dismiss') {
    const tableName = targetType === 'post' ? 'posts' : 'comments'

    const nextStatus =
      action === 'hide'
        ? 'hidden'
        : action === 'delete'
          ? 'deleted'
          : 'visible'

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update({ status: nextStatus })
      .eq('id', targetId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }
  }

  if (reportId) {
    const nextReportStatus = action === 'dismiss' ? 'dismissed' : 'reviewed'

    const { error: reportError } = await supabaseAdmin
      .from('reports')
      .update({ status: nextReportStatus })
      .eq('id', reportId)

    if (reportError) {
      return NextResponse.json(
        { error: reportError.message },
        { status: 500 }
      )
    }
  }

  await supabaseAdmin.from('admin_actions').insert({
    action_type: action,
    target_type: targetType,
    target_id: targetId,
    report_id: reportId ?? null,
    memo: null,
  })

  return NextResponse.json({ ok: true })
}
